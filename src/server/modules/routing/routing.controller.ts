import type { Request, Response } from 'express'
import type { JourneyRequest } from './routing.schema.js'
import { planJourney } from './routing.service.js'

export async function journey(req: Request, res: Response): Promise<void> {
  const { from, to, datetime } = req.body as JourneyRequest

  const options = {
    preference: 'balanced' as const,
    ...(datetime ? { departureTime: new Date(datetime) } : {}),
  }

  try {
    const journeys = await planJourney(from, to, options)
    res.json({ journeys })
  } catch (err) {
    console.error('[routing] planJourney error:', (err as Error).message)
    res.status(502).json({ error: "Service de calcul d'itinéraire indisponible" })
  }
}
