import type {
  Coordinates,
  Journey,
  JourneyOptions,
  JourneySegment,
  TransportMode,
} from '@shared/types/index.js'
import { CO2_FACTORS } from '@shared/constants/co2-factors.js'
import type { TransportProvider } from '../transport-provider.interface.js'

// ─── Types MOTIS response ─────────────────────────────────────────────────────

interface MotisPosition {
  lat: number
  lng: number
}

interface MotisEventInfo {
  time: number // unix timestamp (seconds)
  schedule_time: number
  delay?: number
}

interface MotisStation {
  id: string
  name: string
  pos: MotisPosition
}

interface MotisStop {
  station: MotisStation
  arrival: MotisEventInfo
  departure: MotisEventInfo
  exit: boolean
  enter: boolean
}

interface MotisRange {
  from: number
  to: number
}

interface MotisWalk {
  mumo_type: string
  duration: number // seconds
  range: MotisRange
}

interface MotisTransport {
  name: string
  category_name: string
  clasz: number
  direction?: string
  line_identifier?: string
  range: MotisRange
}

interface MotisMove {
  move_type: 'Walk' | 'Transport'
  move: MotisWalk | MotisTransport
}

interface MotisConnection {
  stops: MotisStop[]
  transports: MotisMove[]
  duration: number // seconds
}

interface MotisRoutingResponse {
  content_type: string
  content: {
    connections?: MotisConnection[]
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function haversineKm(a: Coordinates, b: Coordinates): number {
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
}

function categoryToMode(category: string): TransportMode {
  const c = category.toLowerCase()
  if (c.includes('tram') || c.includes('lrt')) return 'tramway'
  if (c.includes('bus') || c.includes('coach') || c.includes('express')) return 'bus'
  if (c.includes('subway') || c.includes('metro') || c.includes('rail') || c.includes('train'))
    return 'tramway'
  if (c.includes('bike') || c.includes('bicycle') || c.includes('cycle')) return 'bike'
  if (c.includes('scooter')) return 'scooter'
  return 'bus' // fallback
}

function modeLabel(mode: TransportMode): string {
  const labels: Record<TransportMode, string> = {
    walk: 'Marche',
    bus: 'Bus',
    tramway: 'Tramway',
    bike: 'Vélo',
    scooter: 'Trottinette',
  }
  return labels[mode]
}

function mapConnection(conn: MotisConnection, idx: number): Journey {
  const segments: JourneySegment[] = conn.transports.map((move) => {
    const isWalk = move.move_type === 'Walk'
    const range = isWalk ? (move.move as MotisWalk).range : (move.move as MotisTransport).range

    const fromStop = conn.stops[range.from]
    const toStop = conn.stops[range.to]
    const fromCoords: Coordinates = { lat: fromStop.station.pos.lat, lng: fromStop.station.pos.lng }
    const toCoords: Coordinates = { lat: toStop.station.pos.lat, lng: toStop.station.pos.lng }

    const distKm = Math.round(haversineKm(fromCoords, toCoords) * 100) / 100
    const mode: TransportMode = isWalk
      ? 'walk'
      : categoryToMode((move.move as MotisTransport).category_name)
    const co2g = Math.round(distKm * CO2_FACTORS[mode])

    let durationMin: number
    let lineRef: string | undefined
    let lineName: string | undefined

    if (isWalk) {
      durationMin = Math.round((move.move as MotisWalk).duration / 60)
    } else {
      const t = move.move as MotisTransport
      durationMin = Math.max(1, Math.round((toStop.arrival.time - fromStop.departure.time) / 60))
      lineRef = t.line_identifier ?? t.name
      lineName = t.direction ? `${t.name} — ${t.direction}` : t.name
    }

    return {
      mode,
      from: fromCoords,
      to: toCoords,
      distanceKm: distKm,
      durationMin,
      co2g,
      ...(lineRef !== undefined ? { lineRef } : {}),
      ...(lineName !== undefined ? { lineName } : {}),
    }
  })

  const totalDurationMin = Math.round(conn.duration / 60)
  const totalDistanceKm = Math.round(segments.reduce((s, seg) => s + seg.distanceKm, 0) * 100) / 100
  const totalCo2g = segments.reduce((s, seg) => s + seg.co2g, 0)
  const co2SavingG = Math.max(0, Math.round(totalDistanceKm * CO2_FACTORS.car) - totalCo2g)

  const durationScore = Math.max(0, 100 - (totalDurationMin / 120) * 100)
  const maxCo2 = totalDistanceKm * CO2_FACTORS.car
  const co2Score = maxCo2 > 0 ? Math.max(0, (1 - totalCo2g / maxCo2) * 100) : 100
  const score = Math.round(0.4 * durationScore + 0.6 * co2Score)

  const usedModes = [...new Set(segments.map((s) => s.mode))]
  const label = usedModes.map(modeLabel).join(' + ')

  return {
    id: `transitous-${idx}`,
    label,
    segments,
    totalDurationMin,
    totalDistanceKm,
    totalCo2g,
    co2SavingG,
    score,
  }
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export class TransitousProvider implements TransportProvider {
  private readonly baseUrl = process.env.TRANSITOUS_URL ?? 'https://api.transitous.org/api/'

  async getJourneys(
    from: Coordinates,
    to: Coordinates,
    options: JourneyOptions
  ): Promise<Journey[]> {
    const departureTs = Math.floor((options.departureTime ?? new Date()).getTime() / 1000)

    const body = {
      destination: { type: 'Module', target: '/intermodal' },
      content_type: 'IntermodalRoutingRequest',
      content: {
        start_type: 'IntermodalPretripStart',
        start: {
          position: { lat: from.lat, lng: from.lng },
          interval: { begin: departureTs, end: departureTs + 3600 },
          min_connection_count: 5,
          extend_interval_earlier: true,
          extend_interval_later: true,
        },
        start_modes: [
          {
            mode_type: 'FootPPR',
            mode: { search_options: { profile: 'default', duration_limit: 900 } },
          },
        ],
        destination_type: 'InputPosition',
        destination: { lat: to.lat, lng: to.lng },
        destination_modes: [
          {
            mode_type: 'FootPPR',
            mode: { search_options: { profile: 'default', duration_limit: 900 } },
          },
        ],
        search_type: 'Accessibility',
        search_dir: 'Forward',
        router: '',
      },
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15_000)

    let raw: MotisRoutingResponse
    try {
      const res = await fetch(this.baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      })
      clearTimeout(timeout)

      if (!res.ok) {
        throw new Error(`Transitous HTTP ${res.status}`)
      }

      raw = (await res.json()) as MotisRoutingResponse
    } catch (err) {
      clearTimeout(timeout)
      throw new Error(`Transitous indisponible : ${(err as Error).message}`, { cause: err })
    }

    console.log('[routing] Transitous réponse brute :')
    console.log(JSON.stringify(raw, null, 2))

    const connections = raw.content?.connections ?? []
    const journeys = connections.map((conn, idx) => mapConnection(conn, idx))
    console.log(`[routing] TransitousProvider: ${journeys.length} itinéraires mappés`)
    return journeys
  }
}
