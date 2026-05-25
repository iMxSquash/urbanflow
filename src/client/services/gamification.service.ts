import { apiFetch } from '../utils/api-client'
import type { Coordinates, JourneySegment } from '@shared/types/index'

export interface RecordTripResult {
  tripId: string
  co2SavedGrams: number
  pointsEarned: number
  totalPoints: number
  newlyUnlockedBadges: string[]
}

export interface BadgeWithStatus {
  id: string
  name: string
  description: string
  thresholdType: string
  thresholdValue: number
  modeFilter: string | null
  unlocked: boolean
  unlockedAt: string | null
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

export async function getUserBadges(): Promise<BadgeWithStatus[]> {
  const res = await apiFetch('/api/gamification/badges')
  const data: unknown = await res.json()
  if (!res.ok) throw new Error('Impossible de charger les badges')
  return data as BadgeWithStatus[]
}
