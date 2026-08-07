import type { WeatherCondition } from '@shared/types/index'
import { getWeather } from '../services/routing.service'
import { CACHE_KEYS, CACHE_TTL_MS } from '../constants/cache-keys'
import { useFetchResource } from './useFetchResource'

interface WeatherState {
  weather: WeatherCondition | null
  loading: boolean
  error: string | null
}

export function useWeather(): WeatherState {
  const { data, loading, error } = useFetchResource(
    CACHE_KEYS.weather,
    getWeather,
    CACHE_TTL_MS.weather
  )
  return { weather: data ?? null, loading, error }
}
