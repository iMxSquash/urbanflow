import type { BiclooStation, TanLine, TanStop } from '@shared/types/index'

export async function getBiclooStations(signal?: AbortSignal): Promise<BiclooStation[]> {
  const res = await fetch('/api/transport/bicloo-stations', { signal })
  const data: unknown = await res.json()

  if (!res.ok) {
    const err = data as { error?: string }
    throw new Error(err.error ?? 'Erreur lors du chargement des stations Bicloo')
  }

  return (data as { stations: BiclooStation[] }).stations
}

export async function getTanLines(signal?: AbortSignal): Promise<TanLine[]> {
  const res = await fetch('/api/transport/tan-lines', { signal })
  const data: unknown = await res.json()

  if (!res.ok) {
    const err = data as { error?: string }
    throw new Error(err.error ?? 'Erreur lors du chargement des lignes TAN')
  }

  return (data as { lines: TanLine[] }).lines
}

export async function getTanStops(signal?: AbortSignal): Promise<TanStop[]> {
  const res = await fetch('/api/transport/tan-stops', { signal })
  const data: unknown = await res.json()

  if (!res.ok) {
    const err = data as { error?: string }
    throw new Error(err.error ?? 'Erreur lors du chargement des arrêts TAN')
  }

  return (data as { stops: TanStop[] }).stops
}
