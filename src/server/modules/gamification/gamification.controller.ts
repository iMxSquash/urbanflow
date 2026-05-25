import type { Request, Response } from 'express'
import * as gamificationService from './gamification.service.js'
import type { RecordTripInput } from './gamification.schema.js'

export async function recordTrip(req: Request, res: Response): Promise<void> {
  try {
    const input = req.body as RecordTripInput
    const result = await gamificationService.recordTrip(req.user!.sub, input)
    res.status(201).json(result)
  } catch {
    res.status(500).json({ error: 'Erreur interne du serveur' })
  }
}
