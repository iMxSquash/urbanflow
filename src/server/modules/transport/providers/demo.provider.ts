import { readFile } from 'node:fs/promises'
import path from 'node:path'
import type { Coordinates, Journey, JourneyOptions, TransportMode } from '@shared/types/index.js'
import type { TransportProvider } from '../transport-provider.interface.js'

function simulatedWeather(): 'sunny' | 'rainy' {
  if (process.env.DEMO_WEATHER === 'rainy') return 'rainy'
  if (process.env.DEMO_WEATHER === 'sunny') return 'sunny'
  // Heuristique saisonnière : oct–mars = pluie, avr–sept = soleil
  const month = new Date().getMonth() // 0-based
  return month >= 9 || month <= 2 ? 'rainy' : 'sunny'
}

export class DemoProvider implements TransportProvider {
  readonly supportedModes: TransportMode[] = ['walk', 'bus', 'tramway', 'bike', 'scooter']

  async getJourneys(
    _from: Coordinates,
    _to: Coordinates,
    _options: JourneyOptions
  ): Promise<Journey[]> {
    const weather = simulatedWeather()
    const file = weather === 'rainy' ? 'journey-rainy.json' : 'journey-sunny.json'
    const filePath = path.resolve(process.cwd(), 'src/demo-data', file)
    const raw = await readFile(filePath, 'utf-8')
    const parsed = JSON.parse(raw) as { journeys: Journey[] }
    console.log(
      `[routing] DemoProvider: ${parsed.journeys.length} itinéraires (météo simulée: ${weather})`
    )
    return parsed.journeys
  }
}
