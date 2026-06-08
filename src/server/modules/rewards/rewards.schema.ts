import { z } from 'zod'

export const purchaseRewardSchema = z.object({
  rewardId: z.string().uuid(),
})

export type PurchaseRewardInput = z.infer<typeof purchaseRewardSchema>
