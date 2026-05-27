import type { Request, Response } from 'express'
import type { JourneyRequest } from './routing.schema.js'
import { planJourney } from './routing.service.js'
import { getCurrentWeather } from './weather.service.js'

export async function journey(req: Request, res: Response): Promise<void> {
  const {
    from,
    to,
    datetime,
    datetimeType,
    preference,
    preferredModes,
    maxWalkMinutes,
    pmrAccessibility,
  } = req.body as JourneyRequest

  const options = {
    preference,
    datetimeType,
    modes: preferredModes,
    maxWalkMinutes,
    pmrAccessibility,
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

export async function weather(_req: Request, res: Response): Promise<void> {
  try {
    const data = await getCurrentWeather()
    res.json(data)
  } catch (err) {
    console.error('[routing] weather error:', (err as Error).message)
    res.status(503).json({ error: 'Météo indisponible' })
  }
}
