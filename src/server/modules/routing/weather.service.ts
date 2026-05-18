import { readFile } from 'node:fs/promises'
import path from 'node:path'
import type { WeatherCondition } from '@shared/types/index.js'

const NANTES = { lat: 47.218, lng: -1.553 }
const TTL_MS = 10 * 60 * 1000 // 10 minutes

interface CacheEntry {
  data: WeatherCondition
  expiresAt: number
}

// Single-entry cache — Nantes only, TTL 10 min (éco-conception)
let _cache: CacheEntry | null = null
// In-flight promise coalesces concurrent cache misses into one fetch
let _inflight: Promise<WeatherCondition> | null = null

// ─── OpenWeatherMap ───────────────────────────────────────────────────────────

interface OWMWeather {
  main: string
  description: string
  icon: string
}

interface OWMResponse {
  weather: OWMWeather[]
  main: { temp: number; humidity: number }
  wind: { speed: number } // m/s
  name: string
}

function owmCondition(main: string): WeatherCondition['condition'] {
  switch (main.toLowerCase()) {
    case 'rain':
    case 'drizzle':
      return 'rain'
    case 'snow':
      return 'snow'
    case 'thunderstorm':
      return 'thunderstorm'
    case 'clouds':
      return 'clouds'
    default:
      return 'clear'
  }
}

async function fetchFromApi(): Promise<WeatherCondition> {
  const apiKey = process.env.OPENWEATHER_API_KEY
  if (!apiKey) throw new Error('OPENWEATHER_API_KEY non définie')

  const url =
    `https://api.openweathermap.org/data/2.5/weather` +
    `?lat=${NANTES.lat}&lon=${NANTES.lng}&units=metric&lang=fr&appid=${apiKey}`

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 5_000)

  try {
    const res = await fetch(url, { signal: controller.signal })
    if (!res.ok) throw new Error(`OpenWeatherMap HTTP ${res.status}`)
    const raw = (await res.json()) as OWMResponse
    const w = raw.weather[0]
    return {
      city: raw.name,
      condition: owmCondition(w?.main ?? ''),
      temperature: Math.round(raw.main.temp),
      humidity: raw.main.humidity,
      windSpeed: Math.round((raw.wind.speed ?? 0) * 3.6), // m/s → km/h
      description: w?.description ?? '',
      icon: w?.icon ?? '',
      timestamp: new Date().toISOString(),
    }
  } finally {
    clearTimeout(timer)
  }
}

// ─── Demo ─────────────────────────────────────────────────────────────────────

function demoWeatherFile(): string {
  if (process.env.DEMO_WEATHER === 'rainy') return 'weather-rainy.json'
  if (process.env.DEMO_WEATHER === 'sunny') return 'weather-sunny.json'
  // Heuristique saisonnière : oct–mars = pluie, avr–sept = soleil
  const month = new Date().getMonth()
  return month >= 9 || month <= 2 ? 'weather-rainy.json' : 'weather-sunny.json'
}

async function fetchFromDemo(): Promise<WeatherCondition> {
  const filePath = path.resolve(process.cwd(), 'src/demo-data', demoWeatherFile())
  const raw = await readFile(filePath, 'utf-8')
  return JSON.parse(raw) as WeatherCondition
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function getCurrentWeather(): Promise<WeatherCondition> {
  const now = Date.now()
  if (_cache && _cache.expiresAt > now) return Promise.resolve(_cache.data)
  if (_inflight) return _inflight

  _inflight = (process.env.DEMO_MODE === 'true' ? fetchFromDemo() : fetchFromApi())
    .then((data) => {
      _cache = { data, expiresAt: now + TTL_MS }
      console.log(`[weather] ${data.condition} ${data.temperature}°C vent ${data.windSpeed} km/h (cache TTL 10 min)`)
      return data
    })
    .finally(() => {
      _inflight = null
    })

  return _inflight
}
