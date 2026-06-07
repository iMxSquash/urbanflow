import { describe, it, expect } from 'vitest'
import { purchaseRewardSchema } from './rewards.schema.js'

const VALID_UUID = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee'

describe('purchaseRewardSchema', () => {
  it('accepte un rewardId UUID valide', () => {
    expect(purchaseRewardSchema.safeParse({ rewardId: VALID_UUID }).success).toBe(true)
  })

  it("rejette un rewardId qui n'est pas un UUID", () => {
    expect(purchaseRewardSchema.safeParse({ rewardId: 'not-a-uuid' }).success).toBe(false)
  })

  it('rejette un rewardId manquant', () => {
    expect(purchaseRewardSchema.safeParse({}).success).toBe(false)
  })

  it('rejette un rewardId numérique', () => {
    expect(purchaseRewardSchema.safeParse({ rewardId: 12345 }).success).toBe(false)
  })

  it('rejette un payload vide', () => {
    expect(purchaseRewardSchema.safeParse({}).success).toBe(false)
  })
})
