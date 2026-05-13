import type { Request, Response } from 'express'
import * as biclooService from './bicloo.service.js'

export async function getBiclooStations(_req: Request, res: Response): Promise<void> {
  try {
    const stations = await biclooService.getBiclooStations()
    res.status(200).json({ stations })
  } catch (err) {
    console.error('[transport] getBiclooStations:', (err as Error).message)
    res.status(502).json({ error: 'Impossible de récupérer les stations Bicloo' })
  }
}
