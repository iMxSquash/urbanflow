import type pg from 'pg'
import { pool } from '../../db/pool.js'
import { withTransaction } from '../../db/with-transaction.js'
import { CO2_FACTORS } from '../../../shared/constants/co2-factors.js'
import { GRAMS_PER_POINT } from '../../../shared/constants/gamification.js'
import type { TransportMode } from '../../../shared/types/index.js'
import type { RecordTripInput } from './gamification.schema.js'
import type {
  BadgeWithStatus,
  DashboardStats,
  ModeCount,
  RecordTripResult,
  ThresholdType,
  TripRecord,
  WeeklyBar,
} from './gamification.types.js'

export { GRAMS_PER_POINT }

// Ordre de priorité décroissant — TC > actif > marche
// Ajouter un nouveau mode ici suffit, aucune requête SQL à modifier
const MODE_PRIORITY: TransportMode[] = [
  'tramway',
  'bus',
  'train',
  'navibus',
  'bike',
  'scooter',
  'walk',
]

function primaryMode(modes: TransportMode[]): TransportMode {
  for (const m of MODE_PRIORITY) {
    if (modes.includes(m)) return m
  }
  return 'walk'
}

// ── Calculs purs (testables sans BDD) ────────────────────────────────────────

export function computeCo2Saved(
  segments: ReadonlyArray<{ mode: TransportMode; distanceKm: number }>
): {
  totalCo2g: number
  co2SavedGrams: number
} {
  const totalDistKm = segments.reduce((sum, s) => sum + s.distanceKm, 0)
  const totalCo2g = segments.reduce((sum, s) => {
    return sum + s.distanceKm * CO2_FACTORS[s.mode]
  }, 0)
  const carCo2g = totalDistKm * CO2_FACTORS.car
  const co2SavedGrams = Math.max(0, Math.round(carCo2g - totalCo2g))
  return { totalCo2g, co2SavedGrams }
}

export function computePoints(co2SavedGrams: number): number {
  return Math.floor(co2SavedGrams / GRAMS_PER_POINT)
}

// ── Badge check (dans la transaction du trajet) ───────────────────────────────

interface BadgeRow {
  id: string
  name: string
  threshold_type: ThresholdType
  threshold_value: number
  mode_filter: TransportMode | null
}

// Types de seuil implémentés — les autres (ex. streak_days) sont exclus explicitement
const SUPPORTED_THRESHOLD_TYPES = new Set<ThresholdType>([
  'total_trips',
  'total_co2_saved_grams',
  'total_points',
])

interface ProgressStats {
  totalTrips: number
  totalCo2SavedGrams: number
  totalPoints: number
  modeCounts: Partial<Record<TransportMode, number>>
}

// Utilisé aussi bien depuis la transaction de `recordTrip` (client) que depuis
// `getUserBadges` (pool) — d'où l'union de type plutôt qu'un `pg.PoolClient` fixe
async function getProgressStats(
  userId: string,
  db: pg.Pool | pg.PoolClient,
  needsModeCounts: boolean
): Promise<ProgressStats> {
  const { rows: statsRows } = await db.query<{
    total_trips: number
    total_co2_saved_grams: number
    total_points: number
  }>(
    `SELECT
       (SELECT COUNT(*)::int        FROM trips WHERE user_id = $1) AS total_trips,
       (SELECT COALESCE(SUM(co2_saved_grams), 0)::int FROM trips WHERE user_id = $1) AS total_co2_saved_grams,
       total_points
     FROM users WHERE id = $1`,
    [userId]
  )
  const stats = statsRows[0]

  const modeCounts: Partial<Record<TransportMode, number>> = {}
  if (needsModeCounts) {
    const { rows: modeRows } = await db.query<{ mode: TransportMode; count: number }>(
      `SELECT unnest(modes_used) AS mode, COUNT(*)::int AS count
       FROM trips WHERE user_id = $1 GROUP BY mode`,
      [userId]
    )
    for (const row of modeRows) modeCounts[row.mode] = row.count
  }

  return {
    totalTrips: stats.total_trips,
    totalCo2SavedGrams: stats.total_co2_saved_grams,
    totalPoints: stats.total_points,
    modeCounts,
  }
}

// Valeur actuelle de l'utilisateur pour le critère d'un badge — 0 pour un
// threshold_type non supporté (ex. streak_days), déjà écarté en amont pour le
// déblocage mais nécessaire ici pour l'affichage de la progression
function badgeActualValue(
  badge: { threshold_type: ThresholdType; mode_filter: TransportMode | null },
  stats: ProgressStats
): number {
  if (badge.mode_filter !== null) return stats.modeCounts[badge.mode_filter] ?? 0
  switch (badge.threshold_type) {
    case 'total_trips':
      return stats.totalTrips
    case 'total_co2_saved_grams':
      return stats.totalCo2SavedGrams
    case 'total_points':
      return stats.totalPoints
    default:
      return 0
  }
}

async function checkAndUnlockBadges(userId: string, client: pg.PoolClient): Promise<string[]> {
  // Badges pas encore débloqués par cet utilisateur
  const { rows: pending } = await client.query<BadgeRow>(
    `SELECT b.id, b.name, b.threshold_type, b.threshold_value, b.mode_filter
     FROM badges b
     WHERE NOT EXISTS (
       SELECT 1 FROM user_badges ub WHERE ub.badge_id = b.id AND ub.user_id = $1
     )`,
    [userId]
  )

  if (pending.length === 0) return []

  const needsModeCounts = pending.some((b) => b.mode_filter !== null)
  const stats = await getProgressStats(userId, client, needsModeCounts)

  const evaluable = pending.filter(
    (b) => b.mode_filter !== null || SUPPORTED_THRESHOLD_TYPES.has(b.threshold_type)
  )

  const toUnlock = evaluable
    .filter((badge) => badgeActualValue(badge, stats) >= badge.threshold_value)
    .map((badge) => badge.id)

  if (toUnlock.length === 0) return []

  // Seules les lignes effectivement insérées (ON CONFLICT DO NOTHING peut en ignorer)
  const { rows: inserted } = await client.query<{ badge_id: string }>(
    `INSERT INTO user_badges (user_id, badge_id)
     SELECT $1, unnest($2::uuid[])
     ON CONFLICT DO NOTHING
     RETURNING badge_id`,
    [userId, toUnlock]
  )

  const insertedIds = new Set(inserted.map((r) => r.badge_id))
  return pending.filter((b) => insertedIds.has(b.id)).map((b) => b.name)
}

// ── recordTrip ────────────────────────────────────────────────────────────────

export async function recordTrip(
  userId: string,
  input: RecordTripInput
): Promise<RecordTripResult> {
  const { segments, gpsVerified } = input

  const { co2SavedGrams } = computeCo2Saved(segments)
  // Unverified trips earn 0 points to discourage fake submissions
  const pointsEarned = gpsVerified ? computePoints(co2SavedGrams) : 0
  const modesUsed = [...new Set(segments.map((s) => s.mode))]
  const mainMode = primaryMode(modesUsed)

  return withTransaction(async (client) => {
    const tripResult = await client.query<{ id: string }>(
      `INSERT INTO trips (user_id, modes_used, primary_mode, co2_saved_grams, points_earned)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [userId, modesUsed, mainMode, co2SavedGrams, pointsEarned]
    )

    const userResult = await client.query<{ total_points: number }>(
      `UPDATE users SET total_points = total_points + $1 WHERE id = $2 RETURNING total_points`,
      [pointsEarned, userId]
    )

    const tripRow = tripResult.rows[0]
    if (!tripRow) throw new Error('Trip insert returned no row')

    const userRow = userResult.rows[0]
    if (!userRow) throw new Error(`User ${userId} not found — account may have been deleted`)

    const newlyUnlockedBadges = gpsVerified ? await checkAndUnlockBadges(userId, client) : []

    return {
      tripId: tripRow.id,
      co2SavedGrams,
      pointsEarned,
      totalPoints: userRow.total_points,
      newlyUnlockedBadges,
    }
  })
}

// ── getDashboardStats ─────────────────────────────────────────────────────────

export async function getDashboardStats(userId: string): Promise<DashboardStats> {
  const [summaryResult, pointsResult, weeklyResult, modeResult] = await Promise.all([
    // Résumé mensuel (CO2 + nb trajets)
    pool.query<{ co2_saved_grams: number; trip_count: number }>(
      `SELECT
         COALESCE(SUM(co2_saved_grams), 0)::int AS co2_saved_grams,
         COUNT(*)::int AS trip_count
       FROM trips
       WHERE user_id = $1
         AND created_at >= date_trunc('month', now())`,
      [userId]
    ),
    // Total points cumulés
    pool.query<{ total_points: number }>(`SELECT total_points FROM users WHERE id = $1`, [userId]),
    // CO2 hebdomadaire — 4 semaines avec generate_series pour combler les vides
    pool.query<{ week_start: string; co2_saved_grams: number }>(
      `WITH weeks AS (
         SELECT generate_series(
           date_trunc('week', now()) - INTERVAL '3 weeks',
           date_trunc('week', now()),
           '1 week'::interval
         ) AS week_start
       ),
       trip_sums AS (
         SELECT
           date_trunc('week', created_at) AS week_start,
           SUM(co2_saved_grams)::int      AS co2_saved_grams
         FROM trips
         WHERE user_id = $1
           AND created_at >= date_trunc('week', now()) - INTERVAL '3 weeks'
         GROUP BY 1
       )
       SELECT
         to_char(w.week_start, 'YYYY-MM-DD') AS week_start,
         COALESCE(t.co2_saved_grams, 0)      AS co2_saved_grams
       FROM weeks w
       LEFT JOIN trip_sums t USING (week_start)
       ORDER BY w.week_start`,
      [userId]
    ),
    // Mode principal par trajet — 1 ligne par trip, somme = tripCount
    pool.query<{ mode: TransportMode; count: number }>(
      `SELECT primary_mode AS mode, COUNT(*)::int AS count
       FROM trips
       WHERE user_id = $1
         AND created_at >= date_trunc('month', now())
       GROUP BY primary_mode
       ORDER BY count DESC`,
      [userId]
    ),
  ])

  const summary = summaryResult.rows[0]
  const weeklyCo2: WeeklyBar[] = weeklyResult.rows.map((r) => ({
    weekStart: r.week_start,
    co2SavedGrams: r.co2_saved_grams,
  }))
  const modeBreakdown: ModeCount[] = modeResult.rows.map((r) => ({
    mode: r.mode,
    count: r.count,
  }))

  return {
    period: 'month',
    summary: {
      co2SavedGrams: summary.co2_saved_grams,
      tripCount: summary.trip_count,
      totalPoints: pointsResult.rows[0]?.total_points ?? 0,
    },
    weeklyCo2,
    modeBreakdown,
  }
}

// ── getUserTrips ──────────────────────────────────────────────────────────────
// Historique complet (pas seulement le mois en cours) — utilisé par l'export de
// données RGPD (droit à la portabilité, art. 20). Aucune coordonnée GPS : la
// table trips n'en stocke plus (cf. migration 016).

export async function getUserTrips(userId: string): Promise<TripRecord[]> {
  const { rows } = await pool.query<{
    id: string
    modes_used: TransportMode[]
    primary_mode: TransportMode
    co2_saved_grams: number
    points_earned: number
    created_at: string
  }>(
    `SELECT id, modes_used, primary_mode, co2_saved_grams, points_earned, created_at
     FROM trips WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId]
  )

  return rows.map((row) => ({
    id: row.id,
    modesUsed: row.modes_used,
    primaryMode: row.primary_mode,
    co2SavedGrams: row.co2_saved_grams,
    pointsEarned: row.points_earned,
    createdAt: new Date(row.created_at).toISOString(),
  }))
}

// ── getUserBadges ─────────────────────────────────────────────────────────────

export async function getUserBadges(userId: string): Promise<BadgeWithStatus[]> {
  const { rows } = await pool.query<{
    id: string
    name: string
    description: string
    threshold_type: ThresholdType
    threshold_value: number
    mode_filter: TransportMode | null
    unlocked_at: string | null
  }>(
    `SELECT
       b.id, b.name, b.description, b.threshold_type, b.threshold_value, b.mode_filter,
       ub.unlocked_at
     FROM badges b
     LEFT JOIN user_badges ub ON ub.badge_id = b.id AND ub.user_id = $1
     ORDER BY b.threshold_type, b.threshold_value`,
    [userId]
  )

  if (rows.length === 0) return []

  const needsModeCounts = rows.some((b) => b.mode_filter !== null)
  const stats = await getProgressStats(userId, pool, needsModeCounts)

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    thresholdType: row.threshold_type,
    thresholdValue: row.threshold_value,
    modeFilter: row.mode_filter,
    unlocked: row.unlocked_at !== null,
    unlockedAt: row.unlocked_at,
    currentValue: badgeActualValue(row, stats),
  }))
}
