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
