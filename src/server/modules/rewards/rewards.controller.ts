import type { Request, Response } from 'express'
import * as rewardsService from './rewards.service.js'
import { RewardError } from './rewards.service.js'
import type { PurchaseRewardInput } from './rewards.schema.js'

const ERROR_STATUS: Record<rewardsService.RewardErrorCode, number> = {
  NOT_FOUND: 404,
  INACTIVE: 409,
  INSUFFICIENT_POINTS: 409,
}

export async function getCatalog(req: Request, res: Response): Promise<void> {
  try {
    const catalog = await rewardsService.getCatalog(req.user!.sub)
    res.status(200).json(catalog)
  } catch (err) {
    console.error('[rewards] getCatalog error:', err)
    res.status(500).json({ error: 'Erreur interne du serveur' })
  }
}

export async function getMyRedemptions(req: Request, res: Response): Promise<void> {
  try {
    const redemptions = await rewardsService.getUserRedemptions(req.user!.sub)
    res.status(200).json(redemptions)
  } catch (err) {
    console.error('[rewards] getMyRedemptions error:', err)
    res.status(500).json({ error: 'Erreur interne du serveur' })
  }
}

export async function purchase(req: Request, res: Response): Promise<void> {
  try {
    const { rewardId } = req.body as PurchaseRewardInput
    const result = await rewardsService.purchaseReward(req.user!.sub, rewardId)
    res.status(201).json(result)
  } catch (err) {
    if (err instanceof RewardError) {
      res.status(ERROR_STATUS[err.code]).json({ error: err.message })
      return
    }
    console.error('[rewards] purchase error:', err)
    res.status(500).json({ error: 'Erreur interne du serveur' })
  }
}
