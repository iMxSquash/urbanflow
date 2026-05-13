import { apiFetch } from '../utils/api-client'
import type { Coordinates, Journey } from '@shared/types/index'

export async function planJourney(from: Coordinates, to: Coordinates): Promise<Journey[]> {
  const res = await apiFetch('/api/routing/journey', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to }),
  })

  const data: unknown = await res.json()

  if (!res.ok) {
    const err = data as { error?: string }
    throw new Error(err.error ?? "Impossible de calculer l'itinéraire")
  }

  return (data as { journeys: Journey[] }).journeys
}
