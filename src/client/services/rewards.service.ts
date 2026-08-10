import { apiFetch, parseJsonResponse } from '../utils/api-client'

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

export async function getRewardCatalog(): Promise<RewardCatalog> {
  const res = await apiFetch('/api/rewards/catalog')
  return parseJsonResponse<RewardCatalog>(res, 'Impossible de charger le catalogue de récompenses')
}

export async function getMyRedemptions(): Promise<UserRedemption[]> {
  const res = await apiFetch('/api/rewards/my-redemptions')
  return parseJsonResponse<UserRedemption[]>(
    res,
    "Impossible de charger l'historique des récompenses"
  )
}

export async function purchaseReward(rewardId: string): Promise<PurchaseResult> {
  const res = await apiFetch('/api/rewards/purchase', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rewardId }),
  })
  return parseJsonResponse<PurchaseResult>(res, "Impossible d'échanger cette récompense")
}
