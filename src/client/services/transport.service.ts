import type { BiclooStation } from '@shared/types/index'

export async function getBiclooStations(signal?: AbortSignal): Promise<BiclooStation[]> {
  const res = await fetch('/api/transport/bicloo-stations', { signal })
  const data: unknown = await res.json()

  if (!res.ok) {
    const err = data as { error?: string }
    throw new Error(err.error ?? 'Erreur lors du chargement des stations Bicloo')
  }

  return (data as { stations: BiclooStation[] }).stations
}
