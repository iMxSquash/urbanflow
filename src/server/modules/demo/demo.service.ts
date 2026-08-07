import {
  isWeatherDemoMode,
  isDemoMode,
  setWeatherDemoMode,
  setProvidersDemo,
  getDemoWeather,
  setDemoWeather,
  type DemoWeather,
} from './demo-config.js'
import { clearWeatherCache } from '../routing/weather.service.js'
import { clearTanCache } from '../transport/tan.service.js'

export interface DemoModeState {
  demoMode: boolean
  providersDemo: boolean
  weather: DemoWeather
}

export interface UpdateDemoModeInput {
  enabled?: boolean
  providersDemo?: boolean
  weather?: DemoWeather
}

export function getDemoModeState(): DemoModeState {
  return {
    demoMode: isWeatherDemoMode(),
    providersDemo: isDemoMode(),
    weather: getDemoWeather(),
  }
}

export function updateDemoMode(input: UpdateDemoModeInput): DemoModeState {
  const { enabled, providersDemo, weather } = input

  if (typeof enabled === 'boolean') {
    setWeatherDemoMode(enabled)
    if (!enabled) setProvidersDemo(false)
    clearWeatherCache()
    clearTanCache()
    console.log(`[demo] météo démo → ${enabled ? 'activée' : 'désactivée'}`)
  }

  if (enabled !== false && typeof providersDemo === 'boolean') {
    setProvidersDemo(providersDemo)
    clearWeatherCache()
    clearTanCache()
    console.log(`[demo] providers démo → ${providersDemo ? 'activés' : 'désactivés'}`)
  }

  if (weather) {
    setDemoWeather(weather)
    clearWeatherCache()
    console.log(`[demo] météo simulée → ${weather}`)
  }

  return getDemoModeState()
}
