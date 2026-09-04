import { readFile } from 'node:fs/promises'
import path from 'node:path'
import type {
  Coordinates,
  Journey,
  JourneyOptions,
  JourneySegment,
  TransportMode,
} from '@shared/types/index.js'
import { TC_TRANSPORT_MODES } from '@shared/constants/transport-modes.js'
import { DEMO_SCENARIOS, SCENARIO_MATCH_TOLERANCE_KM } from '@shared/constants/demo-scenarios.js'
import type { TransportProvider } from '../transport-provider.interface.js'
import { haversineKm } from '../../../utils/geo.js'
import { getShapeForLeg } from '../gtfs-shapes.service.js'

const TC_MODES: TransportMode[] = TC_TRANSPORT_MODES

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

// Injecte departureTime sur le journey et scheduledDeparture sur tous les segments TC.
function injectScheduledDepartures(journeys: Journey[]): Journey[] {
  const now = Date.now()
  return journeys.map((journey) => {
    let accumulatedMs = 0
    const segments = journey.segments.map((seg) => {
      const waitMs = (seg.waitTimeMin ?? 0) * 60_000
      accumulatedMs += waitMs
      const withDeparture: JourneySegment = TC_MODES.includes(seg.mode)
        ? { ...seg, scheduledDeparture: new Date(now + accumulatedMs).toISOString() }
        : seg
      accumulatedMs += seg.durationMin * 60_000
      return withDeparture
    })
    return { ...journey, segments, departureTime: new Date(now).toISOString() }
  })
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
    from: Coordinates,
    to: Coordinates,
    _options: JourneyOptions
  ): Promise<Journey[]> {
    // Le trajet servi dépend du scénario demandé (origine/destination), jamais de
    // la météo simulée — celle-ci n'intervient que dans le re-scoring confort fait
    // par routing.service.ts après coup. Repli sur le premier scénario si aucune
    // correspondance (garde le mode démo fonctionnel même hors scénario connu).
    const scenario =
      DEMO_SCENARIOS.find(
        (s) =>
          haversineKm(s.from, from) < SCENARIO_MATCH_TOLERANCE_KM &&
          haversineKm(s.to, to) < SCENARIO_MATCH_TOLERANCE_KM
      ) ?? DEMO_SCENARIOS[0]
    const filePath = path.resolve(process.cwd(), 'src/demo-data', scenario.fixtureFile)
    const raw = await readFile(filePath, 'utf-8')
    const parsed = JSON.parse(raw) as { journeys: Journey[] }
    const withShapes = await applyGtfsShapes(parsed.journeys)
    const journeys = injectScheduledDepartures(withShapes)
    console.log(`[routing] DemoProvider: ${journeys.length} itinéraires (scénario: ${scenario.id})`)
    return journeys
  }
}
