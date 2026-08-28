import type { TransportMode } from '../../../shared/types/index.js'

// Miroir de l'enum PostgreSQL `threshold_type` (005-create-badges.sql)
export const THRESHOLD_TYPES = [
  'total_trips',
  'total_co2_saved_grams',
  'total_points',
  'streak_days',
] as const
export type ThresholdType = (typeof THRESHOLD_TYPES)[number]

export interface RecordTripResult {
  tripId: string
  co2SavedGrams: number
  pointsEarned: number
  totalPoints: number
  newlyUnlockedBadges: string[]
}

export interface TripRecord {
  id: string
  modesUsed: TransportMode[]
  primaryMode: TransportMode
  co2SavedGrams: number
  pointsEarned: number
  createdAt: string
}

export interface BadgeWithStatus {
  id: string
  name: string
  description: string
  thresholdType: ThresholdType
  thresholdValue: number
  modeFilter: TransportMode | null
  unlocked: boolean
  unlockedAt: string | null
  currentValue: number
}

export interface WeeklyBar {
  weekStart: string
  co2SavedGrams: number
}

export interface ModeCount {
  mode: TransportMode
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
