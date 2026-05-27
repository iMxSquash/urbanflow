import { apiFetch } from '../utils/api-client'
import type {
  Coordinates,
  Journey,
  TransportMode,
  UserPreference,
  WeatherCondition,
} from '@shared/types/index'

export interface JourneyProfile {
  preference: UserPreference
  preferredModes: TransportMode[]
  maxWalkMinutes: number
  pmrAccessibility: boolean
}

export async function planJourney(
  from: Coordinates,
  to: Coordinates,
  profile?: JourneyProfile,
  datetime?: Date,
  datetimeType?: 'departure' | 'arrival'
): Promise<Journey[]> {
  const res = await apiFetch('/api/routing/journey', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from,
      to,
      ...(datetime ? { datetime: datetime.toISOString() } : {}),
      ...(datetimeType ? { datetimeType } : {}),
      ...(profile
        ? {
            preference: profile.preference,
            preferredModes: profile.preferredModes,
            maxWalkMinutes: profile.maxWalkMinutes,
            pmrAccessibility: profile.pmrAccessibility,
          }
        : {}),
    }),
  })

  const data: unknown = await res.json()

  if (!res.ok) {
    const err = data as { error?: string }
    throw new Error(err.error ?? "Impossible de calculer l'itinéraire")
  }

  return (data as { journeys: Journey[] }).journeys
}

export async function getWeather(signal?: AbortSignal): Promise<WeatherCondition> {
  const res = await apiFetch('/api/routing/weather', { signal })
  const data: unknown = await res.json()
  if (!res.ok) throw new Error('Météo indisponible')
  return data as WeatherCondition
}
