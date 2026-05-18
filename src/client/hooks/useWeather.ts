import { useEffect, useState } from 'react'
import type { WeatherCondition } from '@shared/types/index'
import { getWeather } from '../services/routing.service'

interface WeatherState {
  weather: WeatherCondition | null
  loading: boolean
  error: string | null
}

export function useWeather(): WeatherState {
  const [state, setState] = useState<WeatherState>({ weather: null, loading: true, error: null })

  useEffect(() => {
    const controller = new AbortController()
    getWeather(controller.signal)
      .then((weather) => setState({ weather, loading: false, error: null }))
      .catch((err: Error) => {
        if (err.name !== 'AbortError')
          setState({ weather: null, loading: false, error: err.message })
      })
    return () => controller.abort()
  }, [])

  return state
}
