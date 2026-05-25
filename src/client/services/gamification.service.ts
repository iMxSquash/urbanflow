import { apiFetch } from '../utils/api-client'
import type { Coordinates, JourneySegment } from '@shared/types/index'

export interface RecordTripResult {
  tripId: string
  co2SavedGrams: number
  pointsEarned: number
  totalPoints: number
}

export async function recordTrip(
  origin: Coordinates,
  destination: Coordinates,
  segments: JourneySegment[]
): Promise<RecordTripResult> {
  const res = await apiFetch('/api/gamification/record-trip', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      origin,
      destination,
      segments: segments.map((s) => ({ mode: s.mode, distanceKm: s.distanceKm })),
    }),
  })

  const data: unknown = await res.json()
  if (!res.ok) {
    const err = data as { error?: string }
    throw new Error(err.error ?? "Impossible d'enregistrer le trajet")
  }

  return data as RecordTripResult
}
