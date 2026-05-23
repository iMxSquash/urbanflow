import { readFile } from 'node:fs/promises'
import path from 'node:path'
import type {
  Coordinates,
  Journey,
  JourneyOptions,
  JourneySegment,
  TransportMode,
} from '@shared/types/index.js'
import type { TransportProvider } from '../transport-provider.interface.js'
import { getDemoWeather } from '../../demo/demo-config.js'
import { getShapeForLeg } from '../gtfs-shapes.service.js'

const TC_MODES: TransportMode[] = ['bus', 'tramway', 'navibus', 'train']

async function applyGtfsShapes(journeys: Journey[]): Promise<Journey[]> {
  return Promise.all(
    journeys.map(async (journey) => ({
      ...journey,
      segments: await Promise.all(
        journey.segments.map(async (seg): Promise<JourneySegment> => {
          if (!TC_MODES.includes(seg.mode) || !seg.lineRef || seg.shape) return seg
          const shape = await getShapeForLeg(seg.lineRef, seg.from, seg.to)
          return shape ? { ...seg, shape } : seg
        })
      ),
    }))
  )
}

export class DemoProvider implements TransportProvider {
  readonly supportedModes: TransportMode[] = [
    'walk',
    'bus',
    'tramway',
    'bike',
    'scooter',
    'navibus',
    'train',
  ]

  async getJourneys(
    _from: Coordinates,
    _to: Coordinates,
    _options: JourneyOptions
  ): Promise<Journey[]> {
    const weather = getDemoWeather()
    const file = weather === 'rainy' ? 'journey-rainy.json' : 'journey-sunny.json'
    const filePath = path.resolve(process.cwd(), 'src/demo-data', file)
    const raw = await readFile(filePath, 'utf-8')
    const parsed = JSON.parse(raw) as { journeys: Journey[] }
    const journeys = await applyGtfsShapes(parsed.journeys)
    console.log(
      `[routing] DemoProvider: ${journeys.length} itinéraires (météo simulée: ${weather})`
    )
    return journeys
  }
}
