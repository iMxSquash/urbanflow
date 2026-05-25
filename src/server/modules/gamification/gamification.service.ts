import type pg from 'pg'
import { pool } from '../../db/pool.js'
import { CO2_FACTORS } from '../../../shared/constants/co2-factors.js'
import type { RecordTripInput } from './gamification.schema.js'
import type { BadgeWithStatus, RecordTripResult } from './gamification.types.js'

// 1 point par 10 g de CO2 économisés
export const POINTS_PER_GRAM_SAVED = 10

// ── Calculs purs (testables sans BDD) ────────────────────────────────────────

export function computeCo2Saved(segments: Array<{ mode: string; distanceKm: number }>): {
  totalCo2g: number
  co2SavedGrams: number
} {
  const totalDistKm = segments.reduce((sum, s) => sum + s.distanceKm, 0)
  const totalCo2g = segments.reduce((sum, s) => {
    const factor = (CO2_FACTORS as Record<string, number>)[s.mode] ?? 0
    return sum + s.distanceKm * factor
  }, 0)
  const carCo2g = totalDistKm * CO2_FACTORS.car
  const co2SavedGrams = Math.max(0, Math.round(carCo2g - totalCo2g))
  return { totalCo2g, co2SavedGrams }
}

export function computePoints(co2SavedGrams: number): number {
  return Math.floor(co2SavedGrams / POINTS_PER_GRAM_SAVED)
}

// ── Badge check (dans la transaction du trajet) ───────────────────────────────

interface BadgeRow {
  id: string
  name: string
  threshold_type: 'total_trips' | 'total_co2_saved_grams' | 'total_points'
  threshold_value: number
  mode_filter: string | null
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

  // Stats globales utilisateur
  const { rows: statsRows } = await client.query<{
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

  // Comptage par mode (uniquement si des badges mode-spécifiques sont en attente)
  const modeCounts: Record<string, number> = {}
  const needsModeCounts = pending.some((b) => b.mode_filter !== null)
  if (needsModeCounts) {
    const { rows: modeRows } = await client.query<{ mode: string; count: number }>(
      `SELECT unnest(modes_used) AS mode, COUNT(*)::int AS count
       FROM trips WHERE user_id = $1 GROUP BY mode`,
      [userId]
    )
    for (const row of modeRows) modeCounts[row.mode] = row.count
  }

  // Évaluation de chaque badge
  const toUnlock: string[] = []
  const names: string[] = []

  for (const badge of pending) {
    let actual: number

    if (badge.mode_filter !== null) {
      actual = modeCounts[badge.mode_filter] ?? 0
    } else {
      switch (badge.threshold_type) {
        case 'total_trips':
          actual = stats.total_trips
          break
        case 'total_co2_saved_grams':
          actual = stats.total_co2_saved_grams
          break
        case 'total_points':
          actual = stats.total_points
          break
        default:
          continue
      }
    }

    if (actual >= badge.threshold_value) {
      toUnlock.push(badge.id)
      names.push(badge.name)
    }
  }

  if (toUnlock.length > 0) {
    await client.query(
      `INSERT INTO user_badges (user_id, badge_id)
       SELECT $1, unnest($2::uuid[])
       ON CONFLICT DO NOTHING`,
      [userId, toUnlock]
    )
  }

  return names
}

// ── recordTrip ────────────────────────────────────────────────────────────────

export async function recordTrip(
  userId: string,
  input: RecordTripInput
): Promise<RecordTripResult> {
  const { origin, destination, segments } = input

  const { co2SavedGrams } = computeCo2Saved(segments)
  const pointsEarned = computePoints(co2SavedGrams)
  const modesUsed = [...new Set(segments.map((s) => s.mode))]

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const tripResult = await client.query<{ id: string }>(
      `INSERT INTO trips (user_id, origin, destination, modes_used, co2_saved_grams, points_earned)
       VALUES ($1, ST_SetSRID(ST_MakePoint($2, $3), 4326), ST_SetSRID(ST_MakePoint($4, $5), 4326), $6, $7, $8)
       RETURNING id`,
      [
        userId,
        origin.lng,
        origin.lat,
        destination.lng,
        destination.lat,
        modesUsed,
        co2SavedGrams,
        pointsEarned,
      ]
    )

    const userResult = await client.query<{ total_points: number }>(
      `UPDATE users SET total_points = total_points + $1 WHERE id = $2 RETURNING total_points`,
      [pointsEarned, userId]
    )

    const newlyUnlockedBadges = await checkAndUnlockBadges(userId, client)

    await client.query('COMMIT')

    return {
      tripId: tripResult.rows[0].id,
      co2SavedGrams,
      pointsEarned,
      totalPoints: userResult.rows[0].total_points,
      newlyUnlockedBadges,
    }
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

// ── getUserBadges ─────────────────────────────────────────────────────────────

export async function getUserBadges(userId: string): Promise<BadgeWithStatus[]> {
  const { rows } = await pool.query<{
    id: string
    name: string
    description: string
    threshold_type: string
    threshold_value: number
    mode_filter: string | null
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

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    thresholdType: row.threshold_type,
    thresholdValue: row.threshold_value,
    modeFilter: row.mode_filter,
    unlocked: row.unlocked_at !== null,
    unlockedAt: row.unlocked_at,
  }))
}
