import type { Request, Response } from 'express'
import * as tanService from './tan.service.js'

export async function getTanLines(_req: Request, res: Response): Promise<void> {
  try {
    const lines = await tanService.getTanLines()
    res.status(200).json({ lines })
  } catch (err) {
    console.error('[transport] getTanLines:', (err as Error).message)
    res.status(502).json({ error: 'Impossible de récupérer les lignes TAN' })
  }
}

export async function getTanStops(_req: Request, res: Response): Promise<void> {
  try {
    const stops = await tanService.getTanStops()
    res.status(200).json({ stops })
  } catch (err) {
    console.error('[transport] getTanStops:', (err as Error).message)
    res.status(502).json({ error: 'Impossible de récupérer les arrêts TAN' })
  }
}
