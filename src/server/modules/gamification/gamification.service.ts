import { pool } from '../../db/pool.js'
import { CO2_FACTORS } from '../../../shared/constants/co2-factors.js'
import type { RecordTripInput } from './gamification.schema.js'
import type { RecordTripResult } from './gamification.types.js'

// 1 point par 10 g de CO2 économisés
export const POINTS_PER_GRAM_SAVED = 10

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

    await client.query('COMMIT')

    return {
      tripId: tripResult.rows[0].id,
      co2SavedGrams,
      pointsEarned,
      totalPoints: userResult.rows[0].total_points,
    }
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}
