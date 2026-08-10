import type { BiclooStation, TanLine, TanStop } from '@shared/types/index'
import { parseJsonResponse } from '../utils/api-client'

export async function getBiclooStations(): Promise<BiclooStation[]> {
  const res = await fetch('/api/transport/bicloo-stations')
  const data = await parseJsonResponse<{ stations: BiclooStation[] }>(
    res,
    'Erreur lors du chargement des stations Bicloo'
  )
  return data.stations
}

export async function getTanLines(): Promise<TanLine[]> {
  const res = await fetch('/api/transport/tan-lines')
  const data = await parseJsonResponse<{ lines: TanLine[] }>(
    res,
    'Erreur lors du chargement des lignes TAN'
  )
  return data.lines
}

export async function getTanStops(): Promise<TanStop[]> {
  const res = await fetch('/api/transport/tan-stops')
  const data = await parseJsonResponse<{ stops: TanStop[] }>(
    res,
    'Erreur lors du chargement des arrêts TAN'
  )
  return data.stops
}
