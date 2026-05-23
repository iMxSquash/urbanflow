import type {
  Coordinates,
  Journey,
  JourneyOptions,
  JourneySegment,
  TransportMode,
} from '@shared/types/index.js'
import { CO2_FACTORS } from '@shared/constants/co2-factors.js'
import { computeScore } from '../../routing/scoring.service.js'
import type { TransportProvider } from '../transport-provider.interface.js'
import { getShapeForLeg } from '../gtfs-shapes.service.js'

// ─── Types réponse Transitous (OTP-like, sans wrapper plan) ──────────────────

interface OtpPlace {
  name: string
  lat: number
  lon: number
}

interface OtpLeg {
  mode: string
  duration: number              // secondes — durée trajet seul (sans attente)
  startTime?: string | number   // ISO string ou Unix ms selon la version OTP/MOTIS
  endTime?: string | number     // ISO string ou Unix ms selon la version OTP/MOTIS
  distance?: number             // mètres — absent sur les legs transit
  from: OtpPlace
  to: OtpPlace
  routeShortName?: string
  routeLongName?: string
  headsign?: string
  legGeometry?: { points: string; precision?: number }
}

interface OtpItinerary {
  duration: number // secondes
  legs: OtpLeg[]
}

interface OtpResponse {
  itineraries?: OtpItinerary[] // directement à la racine, pas de wrapper plan
  error?: { message: string }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function decodePolyline(encoded: string, precision = 5): { lat: number; lng: number }[] {
  const factor = 10 ** precision
  const result: { lat: number; lng: number }[] = []
  let index = 0,
    lat = 0,
    lng = 0

  while (index < encoded.length) {
    let b: number,
      shift = 0,
      n = 0
    do {
      b = encoded.charCodeAt(index++) - 63
      n |= (b & 0x1f) << shift
      shift += 5
    } while (b >= 0x20)
    lat += n & 1 ? ~(n >> 1) : n >> 1

    shift = 0
    n = 0
    do {
      b = encoded.charCodeAt(index++) - 63
      n |= (b & 0x1f) << shift
      shift += 5
    } while (b >= 0x20)
    lng += n & 1 ? ~(n >> 1) : n >> 1

    result.push({ lat: lat / factor, lng: lng / factor })
  }
  return result
}

function haversineKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLon = ((b.lon - a.lon) * Math.PI) / 180
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
}

// Normalise un timestamp OTP (ISO string ou Unix ms) en ms epoch.
// Retourne null si la valeur est NaN ou non finie pour éviter une RangeError
// dans new Date().toISOString() en aval.
function toMs(t: string | number): number | null {
  const ms = typeof t === 'number' ? t : new Date(t).getTime()
  return Number.isFinite(ms) ? ms : null
}

function otpModeToTransportMode(mode: string): TransportMode {
  switch (mode.toUpperCase()) {
    case 'WALK':
      return 'walk'
    case 'BICYCLE':
      return 'bike'
    case 'TRAM':
      return 'tramway'
    case 'SUBWAY':
      return 'tramway'
    case 'RAIL':
      return 'train'
    case 'FERRY':
      return 'navibus'
    case 'BUS':
      return 'bus'
    case 'SCOOTER':
      return 'scooter'
    default:
      return 'bus'
  }
}

function modeLabel(mode: TransportMode): string {
  const labels: Record<TransportMode, string> = {
    walk: 'Marche',
    bus: 'Bus',
    tramway: 'Tramway',
    bike: 'Vélo',
    scooter: 'Trottinette',
    navibus: 'Navibus',
    train: 'Train',
  }
  return labels[mode]
}

// ─── Scoring multicritères ────────────────────────────────────────────────────
// Logique centralisée dans scoring.service.ts — computeScore importé.

async function mapItinerary(
  itin: OtpItinerary,
  idx: number,
  options: JourneyOptions
): Promise<Journey> {
  const nowMs = Date.now()
  const TC_MODES_OTP = new Set(['BUS', 'TRAM', 'RAIL', 'FERRY', 'SUBWAY'])

  // Pré-calcul du temps de trajet pur cumulé avant chaque leg (sans attente).
  // Utilisé pour déduire l'attente quand startTime est disponible mais endTime du leg
  // précédent est absent : waitMs = leg.startTime − (nowMs + cumulativeTravelMs[legIdx]).
  const cumulativeTravelMs: number[] = []
  let travelAcc = 0
  for (const leg of itin.legs) {
    cumulativeTravelMs.push(travelAcc)
    travelAcc += leg.duration * 1_000
  }

  // Méthode de secours complète : distribuer le temps d'attente total de l'itinéraire
  // quand startTime est absent de la réponse OTP.
  const totalLegDurationSec = itin.legs.reduce((s, l) => s + l.duration, 0)
  const totalWaitSec = Math.max(0, itin.duration - totalLegDurationSec)
  const tcLegCount = itin.legs.filter((l) => TC_MODES_OTP.has(l.mode.toUpperCase())).length
  const waitPerTcLegSec = tcLegCount > 0 ? Math.round(totalWaitSec / tcLegCount) : 0

  const legScheduledOffsetMs: number[] = []
  let elapsedMs = 0
  for (const leg of itin.legs) {
    const isTC = TC_MODES_OTP.has(leg.mode.toUpperCase())
    const thisWaitMs = isTC ? waitPerTcLegSec * 1_000 : 0
    legScheduledOffsetMs.push(elapsedMs + thisWaitMs)
    elapsedMs += thisWaitMs + leg.duration * 1_000
  }

  const segments: JourneySegment[] = await Promise.all(
    itin.legs.map(async (leg, legIdx): Promise<JourneySegment> => {
      const mode = otpModeToTransportMode(leg.mode)
      const distKm =
        Math.round(
          (leg.distance !== undefined ? leg.distance / 1000 : haversineKm(leg.from, leg.to)) * 100
        ) / 100
      const durationMin = Math.max(1, Math.round(leg.duration / 60))
      const co2g = Math.round(distKm * CO2_FACTORS[mode])

      const lineName = leg.routeShortName
        ? `${leg.routeShortName}${leg.headsign ? ` — ${leg.headsign}` : ''}`
        : undefined

      // Transitous (MOTIS) encodes legGeometry at precision 7; fall back to GTFS
      // shape data when the decoded polyline is absent or too sparse (< 3 points).
      const isTransitLeg = TC_MODES_OTP.has(leg.mode.toUpperCase())
      let shape: Coordinates[] | undefined
      if (leg.legGeometry?.points) {
        const decoded = decodePolyline(leg.legGeometry.points, leg.legGeometry.precision ?? 7)
        if (decoded.length >= 3) shape = decoded
      }
      if (!shape && isTransitLeg && leg.routeShortName) {
        const gtfsShape = await getShapeForLeg(
          leg.routeShortName,
          { lat: leg.from.lat, lng: leg.from.lon },
          { lat: leg.to.lat, lng: leg.to.lon }
        )
        if (gtfsShape) shape = gtfsShape
      }

      // Calcul du temps d'attente et de l'horaire de départ du véhicule TC.
      let waitTimeMin: number | undefined
      let scheduledDeparture: string | undefined

      if (isTransitLeg) {
        if (leg.startTime !== undefined) {
          const startMs = toMs(leg.startTime)
          if (startMs !== null) {
            scheduledDeparture = new Date(startMs).toISOString()

            const prevLeg = legIdx > 0 ? itin.legs[legIdx - 1] : undefined
            if (prevLeg?.endTime !== undefined) {
              // Méthode 1a : gap exact entre endTime du leg précédent et startTime de ce leg
              const endMs = toMs(prevLeg.endTime)
              if (endMs !== null) {
                const gapMin = Math.round((startMs - endMs) / 60_000)
                if (gapMin > 0) waitTimeMin = gapMin
              }
            } else {
              // Méthode 1b : startTime connu, endTime précédent absent.
              // Attente = heure de départ TC − (maintenant + temps de trajet cumulé avant ce leg).
              const expectedArrivalAtStopMs = nowMs + cumulativeTravelMs[legIdx]
              const waitMs = startMs - expectedArrivalAtStopMs
              if (waitMs > 60_000) waitTimeMin = Math.round(waitMs / 60_000)
            }
          }
        } else if (waitPerTcLegSec > 0) {
          // Méthode 2 : startTime absent — répartition de l'attente totale de l'itinéraire
          waitTimeMin = Math.round(waitPerTcLegSec / 60) || undefined
          scheduledDeparture = new Date(nowMs + legScheduledOffsetMs[legIdx]).toISOString()
        }
      }

      return {
        mode,
        from: { lat: leg.from.lat, lng: leg.from.lon },
        to: { lat: leg.to.lat, lng: leg.to.lon },
        distanceKm: distKm,
        durationMin,
        co2g,
        ...(leg.routeShortName ? { lineRef: leg.routeShortName } : {}),
        ...(lineName ? { lineName } : {}),
        ...(shape ? { shape } : {}),
        ...(waitTimeMin !== undefined ? { waitTimeMin } : {}),
        ...(scheduledDeparture ? { scheduledDeparture } : {}),
      }
    })
  )

  const totalDurationMin = Math.round(itin.duration / 60)
  const totalDistanceKm = Math.round(segments.reduce((s, seg) => s + seg.distanceKm, 0) * 100) / 100
  const totalCo2g = segments.reduce((s, seg) => s + seg.co2g, 0)
  const co2SavingG = Math.max(0, Math.round(totalDistanceKm * CO2_FACTORS.car) - totalCo2g)

  const score = computeScore(segments, totalDurationMin, totalDistanceKm, totalCo2g, options)

  const usedModes = [...new Set(segments.map((s) => s.mode))]
  const label = usedModes.map(modeLabel).join(' + ')

  const firstLeg = itin.legs[0]
  const firstLegStartMs = firstLeg?.startTime !== undefined ? toMs(firstLeg.startTime) : null
  const departureTime = firstLegStartMs !== null ? new Date(firstLegStartMs).toISOString() : undefined

  return {
    id: `transitous-${idx}`,
    label,
    segments,
    totalDurationMin,
    totalDistanceKm,
    totalCo2g,
    co2SavingG,
    score,
    ...(departureTime ? { departureTime } : {}),
  }
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export class TransitousProvider implements TransportProvider {
  readonly supportedModes: TransportMode[] = ['bus', 'tramway', 'navibus', 'train']
  private readonly baseUrl = (
    process.env.TRANSITOUS_URL ?? 'https://api.transitous.org/api/'
  ).replace(/\/$/, '')

  async getJourneys(
    from: Coordinates,
    to: Coordinates,
    options: JourneyOptions
  ): Promise<Journey[]> {
    const params = new URLSearchParams({
      fromPlace: `${from.lat},${from.lng}`,
      toPlace: `${to.lat},${to.lng}`,
      numItineraries: '5',
      arriveBy: 'false',
    })

    // Traduire les modes utilisateur en modes OTP et les passer à Transitous.
    // WALK est toujours inclus (legs de connexion). Sans filtre → OTP choisit librement.
    const OTP_MODE: Partial<Record<TransportMode, string>> = {
      bus: 'BUS',
      tramway: 'TRAM',
      navibus: 'FERRY',
      train: 'RAIL',
    }
    const requestedTC = (options.modes ?? []).filter((m) => this.supportedModes.includes(m))
    if (requestedTC.length > 0) {
      const otpModes = ['WALK', ...requestedTC.map((m) => OTP_MODE[m]).filter(Boolean)]
      params.set('mode', otpModes.join(','))
    }

    const url = `${this.baseUrl}/v1/plan?${params}`

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15_000)

    let raw: OtpResponse
    try {
      const res = await fetch(url, { signal: controller.signal })
      clearTimeout(timeout)

      if (!res.ok) {
        const body = await res.text().catch(() => '')
        console.error(`[routing] Transitous ${res.status} — URL: ${url}`)
        console.error(`[routing] Transitous body: ${body}`)
        throw new Error(`Transitous HTTP ${res.status}`)
      }

      raw = (await res.json()) as OtpResponse
    } catch (err) {
      clearTimeout(timeout)
      throw new Error(`Transitous indisponible : ${(err as Error).message}`, { cause: err })
    }

    if (raw.error) {
      throw new Error(`Transitous erreur : ${raw.error.message}`)
    }

    const itineraries = raw.itineraries ?? []
    const journeys = await Promise.all(
      itineraries.map((itin, idx) => mapItinerary(itin, idx, options))
    )
    console.log(`[routing] TransitousProvider: ${journeys.length} itinéraires mappés`)
    return journeys
  }
}
