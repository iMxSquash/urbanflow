import { apiFetch, parseJsonResponse } from '../utils/api-client'
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
  avoidElevation?: boolean
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
            avoidElevation: profile.avoidElevation ?? false,
          }
        : {}),
    }),
  })

  const data = await parseJsonResponse<{ journeys: Journey[] }>(
    res,
    "Impossible de calculer l'itinéraire"
  )
  return data.journeys
}

export async function getWeather(): Promise<WeatherCondition> {
  const res = await apiFetch('/api/routing/weather')
  return parseJsonResponse<WeatherCondition>(res, 'Météo indisponible')
}
