import type { WeatherCondition } from '@shared/types/index'
import { getWeather } from '../services/routing.service'
import { useFetchResource } from './useFetchResource'

interface WeatherState {
  weather: WeatherCondition | null
  loading: boolean
  error: string | null
}

// Aligné sur le cache mémoire OpenWeather côté serveur (10 min, CLAUDE.md) —
// pas d'intérêt à refetch plus souvent que le serveur ne rafraîchit lui-même.
const TTL_MS = 10 * 60 * 1000

export function useWeather(): WeatherState {
  const { data, loading, error } = useFetchResource('weather', () => getWeather(), TTL_MS)
  return { weather: data ?? null, loading, error }
}
