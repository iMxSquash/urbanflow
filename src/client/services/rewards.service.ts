import { apiFetch } from '../utils/api-client'

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
  const data: unknown = await res.json()
  if (!res.ok) throw new Error('Impossible de charger le catalogue de récompenses')
  return data as RewardCatalog
}

export async function getMyRedemptions(): Promise<UserRedemption[]> {
  const res = await apiFetch('/api/rewards/my-redemptions')
  const data: unknown = await res.json()
  if (!res.ok) throw new Error("Impossible de charger l'historique des récompenses")
  return data as UserRedemption[]
}

export async function purchaseReward(rewardId: string): Promise<PurchaseResult> {
  const res = await apiFetch('/api/rewards/purchase', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rewardId }),
  })
  const data: unknown = await res.json()
  if (!res.ok) {
    const err = data as { error?: string }
    throw new Error(err.error ?? "Impossible d'échanger cette récompense")
  }
  return data as PurchaseResult
}
