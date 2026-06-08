export type RewardType = 'discount_code' | 'museum_ticket'

export interface RewardCatalogItem {
  id: string
  name: string
  description: string
  rewardType: RewardType
  pointsCost: number
  partnerName: string
  affordable: boolean
}

export interface RewardCatalog {
  totalPoints: number
  rewards: RewardCatalogItem[]
}

export interface UserRedemption {
  id: string
  rewardId: string
  rewardName: string
  rewardType: RewardType
  partnerName: string
  code: string
  pointsSpent: number
  redeemedAt: string
}

export interface PurchaseResult {
  redemptionId: string
  code: string
  pointsSpent: number
  totalPoints: number
}
