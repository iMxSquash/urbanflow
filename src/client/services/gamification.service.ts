import { apiFetch, parseJsonResponse } from '../utils/api-client'
import type { JourneySegment } from '@shared/types/index'

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
  segments: JourneySegment[],
  gpsVerified = true
): Promise<RecordTripResult> {
  const res = await apiFetch('/api/gamification/record-trip', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      segments: segments.map((s) => ({ mode: s.mode, distanceKm: s.distanceKm })),
      gpsVerified,
    }),
  })
  return parseJsonResponse<RecordTripResult>(res, "Impossible d'enregistrer le trajet")
}

export async function getUserBadges(): Promise<BadgeWithStatus[]> {
  const res = await apiFetch('/api/gamification/badges')
  return parseJsonResponse<BadgeWithStatus[]>(res, 'Impossible de charger les badges')
}

export interface WeeklyBar {
  weekStart: string
  co2SavedGrams: number
}

export interface ModeCount {
  mode: string
  count: number
}

export interface DashboardStats {
  period: 'month'
  summary: {
    co2SavedGrams: number
    tripCount: number
    totalPoints: number
  }
  weeklyCo2: WeeklyBar[]
  modeBreakdown: ModeCount[]
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const res = await apiFetch('/api/gamification/stats?period=month')
  return parseJsonResponse<DashboardStats>(res, 'Impossible de charger les statistiques')
}
