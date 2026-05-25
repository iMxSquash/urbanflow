import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../db/pool.js', () => ({
  pool: { query: vi.fn(), connect: vi.fn() },
}))

import { pool } from '../../db/pool.js'
import {
  computeCo2Saved,
  computePoints,
  GRAMS_PER_POINT,
  recordTrip,
  getDashboardStats,
  getUserBadges,
} from './gamification.service.js'
import { CO2_FACTORS } from '../../../shared/constants/co2-factors.js'

const mockPoolQuery = pool.query as ReturnType<typeof vi.fn>
const mockConnect = pool.connect as ReturnType<typeof vi.fn>
const mockClient = { query: vi.fn(), release: vi.fn() }

const USER_ID = 'aaaaaaaa-0000-0000-0000-000000000001'
const TRIP_ID = 'bbbbbbbb-0000-0000-0000-000000000001'
const BADGE_ID = 'cccccccc-0000-0000-0000-000000000001'

// 5 km tramway → co2 trajet = 20 g, voiture = 1265 g → économie = 1245 g → 124 pts
const BASE_INPUT = {
  origin: { lat: 47.218, lng: -1.553 },
  destination: { lat: 47.225, lng: -1.56 },
  segments: [{ mode: 'tramway' as const, distanceKm: 5 }],
}
const EXPECTED_CO2 = 1245
const EXPECTED_POINTS = 124

beforeEach(() => {
  vi.clearAllMocks()
  mockConnect.mockResolvedValue(mockClient)
})

// ── computeCo2Saved ───────────────────────────────────────────────────────────

describe('computeCo2Saved', () => {
  it('trajet 100% tramway : économie proche de 100% vs voiture', () => {
    const segments = [{ mode: 'tramway', distanceKm: 10 }] as const
    const { co2SavedGrams } = computeCo2Saved(segments)

    const carCo2 = 10 * CO2_FACTORS.car
    const tramCo2 = 10 * CO2_FACTORS.tramway
    expect(co2SavedGrams).toBe(Math.max(0, Math.round(carCo2 - tramCo2)))
  })

  it('trajet marche : facteur CO2 = 0, économie = 100% du coût voiture équivalent', () => {
    const segments = [{ mode: 'walk', distanceKm: 5 }] as const
    const { co2SavedGrams } = computeCo2Saved(segments)
    expect(co2SavedGrams).toBe(Math.round(5 * CO2_FACTORS.car))
  })

  it('trajet multimodal : addition des CO2 par segment', () => {
    const segments = [
      { mode: 'walk', distanceKm: 0.5 },
      { mode: 'bus', distanceKm: 8 },
      { mode: 'walk', distanceKm: 0.3 },
    ] as const
    const { totalCo2g, co2SavedGrams } = computeCo2Saved(segments)

    const expectedCo2 = 0.5 * CO2_FACTORS.walk + 8 * CO2_FACTORS.bus + 0.3 * CO2_FACTORS.walk
    expect(totalCo2g).toBeCloseTo(expectedCo2)

    const totalDistKm = 0.5 + 8 + 0.3
    const carCo2 = totalDistKm * CO2_FACTORS.car
    expect(co2SavedGrams).toBe(Math.max(0, Math.round(carCo2 - expectedCo2)))
  })

  it('co2SavedGrams est toujours >= 0 (jamais négatif)', () => {
    const segments = [{ mode: 'tramway', distanceKm: 0 }] as const
    const { co2SavedGrams } = computeCo2Saved(segments)
    expect(co2SavedGrams).toBeGreaterThanOrEqual(0)
  })

  it('trajets vélo et marche : CO2 trajet = 0, économie = 100% coût voiture', () => {
    const segments = [
      { mode: 'bike', distanceKm: 3 },
      { mode: 'walk', distanceKm: 0.5 },
    ] as const
    const { totalCo2g, co2SavedGrams } = computeCo2Saved(segments)

    expect(totalCo2g).toBe(0)
    expect(co2SavedGrams).toBe(Math.round(3.5 * CO2_FACTORS.car))
  })
})

// ── computePoints ─────────────────────────────────────────────────────────────

describe('computePoints', () => {
  it(`1 point par ${GRAMS_PER_POINT}g de CO2 économisés`, () => {
    expect(computePoints(100)).toBe(10)
    expect(computePoints(150)).toBe(15)
    expect(computePoints(99)).toBe(9)
  })

  it('0 g économisés → 0 points', () => {
    expect(computePoints(0)).toBe(0)
  })

  it("arrondi à l'entier inférieur", () => {
    expect(computePoints(19)).toBe(1)
    expect(computePoints(10)).toBe(1)
    expect(computePoints(9)).toBe(0)
  })
})

// ── recordTrip ────────────────────────────────────────────────────────────────

describe('recordTrip', () => {
  function setupClientSequence(...responses: Array<{ rows: unknown[] }>) {
    let i = 0
    mockClient.query.mockImplementation(() => Promise.resolve(responses[i++] ?? { rows: [] }))
  }

  it('retourne le résultat correct (CO2, points, tripId)', async () => {
    setupClientSequence(
      { rows: [] },                                       // BEGIN
      { rows: [{ id: TRIP_ID }] },                        // INSERT trips
      { rows: [{ total_points: EXPECTED_POINTS }] },      // UPDATE users
      { rows: [] },                                       // SELECT pending badges → aucun
      { rows: [] },                                       // COMMIT
    )

    const result = await recordTrip(USER_ID, BASE_INPUT)

    expect(result.tripId).toBe(TRIP_ID)
    expect(result.co2SavedGrams).toBe(EXPECTED_CO2)
    expect(result.pointsEarned).toBe(EXPECTED_POINTS)
    expect(result.totalPoints).toBe(EXPECTED_POINTS)
    expect(result.newlyUnlockedBadges).toEqual([])
  })

  it('ouvre la transaction avec BEGIN et la valide avec COMMIT', async () => {
    setupClientSequence(
      { rows: [] },
      { rows: [{ id: TRIP_ID }] },
      { rows: [{ total_points: EXPECTED_POINTS }] },
      { rows: [] },
      { rows: [] },
    )

    await recordTrip(USER_ID, BASE_INPUT)

    const sqls = mockClient.query.mock.calls.map((call) => String(call[0]).trim())
    expect(sqls[0]).toBe('BEGIN')
    expect(sqls[sqls.length - 1]).toBe('COMMIT')
  })

  it('libère le client dans tous les cas (finally)', async () => {
    setupClientSequence(
      { rows: [] },
      { rows: [{ id: TRIP_ID }] },
      { rows: [{ total_points: EXPECTED_POINTS }] },
      { rows: [] },
      { rows: [] },
    )

    await recordTrip(USER_ID, BASE_INPUT)

    expect(mockClient.release).toHaveBeenCalledOnce()
  })

  it('rollback et libère le client si user introuvable', async () => {
    setupClientSequence(
      { rows: [] },             // BEGIN
      { rows: [{ id: TRIP_ID }] }, // INSERT trips
      { rows: [] },             // UPDATE users → 0 lignes
      { rows: [] },             // ROLLBACK
    )

    await expect(recordTrip(USER_ID, BASE_INPUT)).rejects.toThrow('not found')

    const sqls = mockClient.query.mock.calls.map((call) => String(call[0]).trim())
    expect(sqls).toContain('ROLLBACK')
    expect(mockClient.release).toHaveBeenCalledOnce()
  })

  it('débloque un badge et le retourne dans newlyUnlockedBadges', async () => {
    setupClientSequence(
      { rows: [] },
      { rows: [{ id: TRIP_ID }] },
      { rows: [{ total_points: EXPECTED_POINTS }] },
      { rows: [{ id: BADGE_ID, name: 'premier-trajet', threshold_type: 'total_trips', threshold_value: 1, mode_filter: null }] },
      { rows: [{ total_trips: 1, total_co2_saved_grams: EXPECTED_CO2, total_points: EXPECTED_POINTS }] },
      { rows: [{ badge_id: BADGE_ID }] },  // INSERT user_badges RETURNING
      { rows: [] },                        // COMMIT
    )

    const result = await recordTrip(USER_ID, BASE_INPUT)

    expect(result.newlyUnlockedBadges).toEqual(['premier-trajet'])
  })

  it("ne retourne pas un badge si l'INSERT est ignoré par ON CONFLICT", async () => {
    setupClientSequence(
      { rows: [] },
      { rows: [{ id: TRIP_ID }] },
      { rows: [{ total_points: EXPECTED_POINTS }] },
      { rows: [{ id: BADGE_ID, name: 'premier-trajet', threshold_type: 'total_trips', threshold_value: 1, mode_filter: null }] },
      { rows: [{ total_trips: 1, total_co2_saved_grams: EXPECTED_CO2, total_points: EXPECTED_POINTS }] },
      { rows: [] },  // INSERT RETURNING → 0 lignes (ON CONFLICT)
      { rows: [] },  // COMMIT
    )

    const result = await recordTrip(USER_ID, BASE_INPUT)

    expect(result.newlyUnlockedBadges).toEqual([])
  })

  it("ne débloque pas un badge si le seuil n'est pas atteint", async () => {
    setupClientSequence(
      { rows: [] },
      { rows: [{ id: TRIP_ID }] },
      { rows: [{ total_points: EXPECTED_POINTS }] },
      { rows: [{ id: BADGE_ID, name: 'habitue', threshold_type: 'total_trips', threshold_value: 20, mode_filter: null }] },
      { rows: [{ total_trips: 1, total_co2_saved_grams: EXPECTED_CO2, total_points: EXPECTED_POINTS }] },
      { rows: [] },  // COMMIT (pas d'INSERT badges)
    )

    const result = await recordTrip(USER_ID, BASE_INPUT)

    expect(result.newlyUnlockedBadges).toEqual([])
    const sqls = mockClient.query.mock.calls.map((call) => String(call[0]))
    expect(sqls.some((s) => s.includes('INSERT INTO user_badges'))).toBe(false)
  })
})

// ── getDashboardStats ─────────────────────────────────────────────────────────

describe('getDashboardStats', () => {
  const WEEKLY_ROWS = [
    { week_start: '2026-04-28', co2_saved_grams: 300 },
    { week_start: '2026-05-05', co2_saved_grams: 0 },
    { week_start: '2026-05-12', co2_saved_grams: 945 },
    { week_start: '2026-05-19', co2_saved_grams: 0 },
  ]

  it('retourne les stats correctement mappées depuis les 4 requêtes', async () => {
    mockPoolQuery
      .mockResolvedValueOnce({ rows: [{ co2_saved_grams: 1245, trip_count: 3 }] })
      .mockResolvedValueOnce({ rows: [{ total_points: 530 }] })
      .mockResolvedValueOnce({ rows: WEEKLY_ROWS })
      .mockResolvedValueOnce({ rows: [{ mode: 'tramway', count: 2 }, { mode: 'walk', count: 1 }] })

    const stats = await getDashboardStats(USER_ID)

    expect(stats.period).toBe('month')
    expect(stats.summary.co2SavedGrams).toBe(1245)
    expect(stats.summary.tripCount).toBe(3)
    expect(stats.summary.totalPoints).toBe(530)
    expect(stats.weeklyCo2).toHaveLength(4)
    expect(stats.weeklyCo2[0]).toEqual({ weekStart: '2026-04-28', co2SavedGrams: 300 })
    expect(stats.modeBreakdown).toEqual([
      { mode: 'tramway', count: 2 },
      { mode: 'walk', count: 1 },
    ])
  })

  it('renvoie des zéros si aucun trajet ce mois (mois vide)', async () => {
    mockPoolQuery
      .mockResolvedValueOnce({ rows: [{ co2_saved_grams: 0, trip_count: 0 }] })
      .mockResolvedValueOnce({ rows: [{ total_points: 0 }] })
      .mockResolvedValueOnce({ rows: WEEKLY_ROWS.map((w) => ({ ...w, co2_saved_grams: 0 })) })
      .mockResolvedValueOnce({ rows: [] })

    const stats = await getDashboardStats(USER_ID)

    expect(stats.summary.co2SavedGrams).toBe(0)
    expect(stats.summary.tripCount).toBe(0)
    expect(stats.modeBreakdown).toEqual([])
    expect(stats.weeklyCo2.every((w) => w.co2SavedGrams === 0)).toBe(true)
  })

  it('utilise 0 comme fallback si total_points absent', async () => {
    mockPoolQuery
      .mockResolvedValueOnce({ rows: [{ co2_saved_grams: 0, trip_count: 0 }] })
      .mockResolvedValueOnce({ rows: [] })  // pas de ligne users
      .mockResolvedValueOnce({ rows: WEEKLY_ROWS })
      .mockResolvedValueOnce({ rows: [] })

    const stats = await getDashboardStats(USER_ID)

    expect(stats.summary.totalPoints).toBe(0)
  })
})

// ── getUserBadges ─────────────────────────────────────────────────────────────

describe('getUserBadges', () => {
  const BASE_BADGE = {
    id: BADGE_ID,
    name: 'eco-citoyen',
    description: '100 g de CO₂ économisés',
    threshold_type: 'total_co2_saved_grams',
    threshold_value: 100,
    mode_filter: null,
  }

  it('retourne un badge débloqué avec unlocked = true et unlockedAt renseigné', async () => {
    mockPoolQuery.mockResolvedValueOnce({
      rows: [{ ...BASE_BADGE, unlocked_at: '2026-05-20T10:00:00.000Z' }],
    })

    const badges = await getUserBadges(USER_ID)

    expect(badges).toHaveLength(1)
    expect(badges[0].unlocked).toBe(true)
    expect(badges[0].unlockedAt).toBe('2026-05-20T10:00:00.000Z')
    expect(badges[0].name).toBe('eco-citoyen')
  })

  it('retourne un badge verrouillé avec unlocked = false et unlockedAt = null', async () => {
    mockPoolQuery.mockResolvedValueOnce({
      rows: [{ ...BASE_BADGE, unlocked_at: null }],
    })

    const badges = await getUserBadges(USER_ID)

    expect(badges[0].unlocked).toBe(false)
    expect(badges[0].unlockedAt).toBeNull()
  })

  it('mappe correctement tous les champs du badge', async () => {
    mockPoolQuery.mockResolvedValueOnce({
      rows: [{ ...BASE_BADGE, unlocked_at: null }],
    })

    const badges = await getUserBadges(USER_ID)

    expect(badges[0]).toMatchObject({
      id: BADGE_ID,
      name: 'eco-citoyen',
      description: '100 g de CO₂ économisés',
      thresholdType: 'total_co2_saved_grams',
      thresholdValue: 100,
      modeFilter: null,
    })
  })

  it('retourne une liste vide si aucun badge en base', async () => {
    mockPoolQuery.mockResolvedValueOnce({ rows: [] })

    const badges = await getUserBadges(USER_ID)

    expect(badges).toEqual([])
  })
})
