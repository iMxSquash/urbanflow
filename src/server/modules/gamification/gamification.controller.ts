import type { Request, Response } from 'express'
import * as gamificationService from './gamification.service.js'
import type { RecordTripInput } from './gamification.schema.js'

export async function recordTrip(req: Request, res: Response): Promise<void> {
  try {
    const input = req.body as RecordTripInput
    const result = await gamificationService.recordTrip(req.user!.sub, input)
    res.status(201).json(result)
  } catch (err) {
    console.error('[gamification] recordTrip error:', err)
    res.status(500).json({ error: 'Erreur interne du serveur' })
  }
}

export async function getBadges(req: Request, res: Response): Promise<void> {
  try {
    const badges = await gamificationService.getUserBadges(req.user!.sub)
    res.status(200).json(badges)
  } catch (err) {
    console.error('[gamification] getBadges error:', err)
    res.status(500).json({ error: 'Erreur interne du serveur' })
  }
}

export async function getStats(req: Request, res: Response): Promise<void> {
  // req.validatedQuery n'est pas relu ici : getStatsQuerySchema n'accepte que
  // 'month', il n'y a donc rien à faire varier dans getDashboardStats. Le
  // middleware sert uniquement à rejeter les valeurs invalides avant d'arriver
  // ici — à relire si `period` gagne d'autres valeurs un jour.
  try {
    const stats = await gamificationService.getDashboardStats(req.user!.sub)
    res.status(200).json(stats)
  } catch (err) {
    console.error('[gamification] getStats error:', err)
    res.status(500).json({ error: 'Erreur interne du serveur' })
  }
}
