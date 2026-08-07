import type { Request, Response } from 'express'
import {
  isWeatherDemoMode,
  isDemoMode,
  setWeatherDemoMode,
  setProvidersDemo,
  getDemoWeather,
  setDemoWeather,
} from './demo-config.js'
import { clearWeatherCache } from '../routing/weather.service.js'
import { clearTanCache } from '../transport/tan.service.js'

function modeState(): {
  demoMode: boolean
  providersDemo: boolean
  weather: ReturnType<typeof getDemoWeather>
} {
  return {
    demoMode: isWeatherDemoMode(),
    providersDemo: isDemoMode(),
    weather: getDemoWeather(),
  }
}

export function getMode(_req: Request, res: Response): void {
  res.json(modeState())
}

export function patchMode(req: Request, res: Response): void {
  const { enabled, providersDemo, weather } = req.body as {
    enabled?: boolean
    providersDemo?: boolean
    weather?: 'sunny' | 'rainy'
  }

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

  res.json(modeState())
}
