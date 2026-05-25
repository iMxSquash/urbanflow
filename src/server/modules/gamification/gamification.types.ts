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
