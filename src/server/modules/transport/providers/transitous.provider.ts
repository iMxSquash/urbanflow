import type { Coordinates, Journey, JourneyOptions, JourneySegment, TransportMode, UserPreference } from '@shared/types/index.js'
import { CO2_FACTORS } from '@shared/constants/co2-factors.js'
import type { TransportProvider } from '../transport-provider.interface.js'

// ─── Types réponse Transitous (OTP-like, sans wrapper plan) ──────────────────

interface OtpPlace {
  name: string
  lat: number
  lon: number
}

interface OtpLeg {
  mode: string
  duration: number        // secondes
  distance?: number       // mètres — absent sur les legs transit
  from: OtpPlace
  to: OtpPlace
  routeShortName?: string
  routeLongName?: string
  headsign?: string
  legGeometry?: { points: string; precision?: number }
}

interface OtpItinerary {
  duration: number        // secondes
  legs: OtpLeg[]
}

interface OtpResponse {
  itineraries?: OtpItinerary[]   // directement à la racine, pas de wrapper plan
  error?: { message: string }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function decodePolyline(encoded: string, precision = 5): { lat: number; lng: number }[] {
  const factor = 10 ** precision
  const result: { lat: number; lng: number }[] = []
  let index = 0, lat = 0, lng = 0

  while (index < encoded.length) {
    let b: number, shift = 0, n = 0
    do { b = encoded.charCodeAt(index++) - 63; n |= (b & 0x1f) << shift; shift += 5 } while (b >= 0x20)
    lat += n & 1 ? ~(n >> 1) : n >> 1

    shift = 0; n = 0
    do { b = encoded.charCodeAt(index++) - 63; n |= (b & 0x1f) << shift; shift += 5 } while (b >= 0x20)
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

function otpModeToTransportMode(mode: string): TransportMode {
  switch (mode.toUpperCase()) {
    case 'WALK':        return 'walk'
    case 'BICYCLE':     return 'bike'
    case 'TRAM':        return 'tramway'
    case 'SUBWAY':
    case 'RAIL':        return 'tramway'
    case 'BUS':
    case 'FERRY':       return 'bus'
    case 'SCOOTER':     return 'scooter'
    default:            return 'bus'
  }
}

function modeLabel(mode: TransportMode): string {
  const labels: Record<TransportMode, string> = {
    walk: 'Marche', bus: 'Bus', tramway: 'Tramway', bike: 'Vélo', scooter: 'Trottinette',
  }
  return labels[mode]
}

// ─── Scoring multicritères ────────────────────────────────────────────────────

function scoringWeights(preference: UserPreference): { duration: number; co2: number; comfort: number } {
  switch (preference) {
    case 'eco':      return { duration: 0.2, co2: 0.7, comfort: 0.1 }
    case 'fast':     return { duration: 0.7, co2: 0.2, comfort: 0.1 }
    default:         return { duration: 0.4, co2: 0.5, comfort: 0.1 }
  }
}

function computeComfortScore(
  segments: JourneySegment[],
  preferredModes: TransportMode[],
  maxWalkMinutes: number,
): number {
  // Ratio de segments utilisant un mode préféré
  let base = preferredModes.length > 0
    ? Math.round((segments.filter(s => preferredModes.includes(s.mode)).length / segments.length) * 100)
    : 50

  // Pénalité si un segment de marche dépasse la tolérance utilisateur
  const maxWalkSeg = segments
    .filter(s => s.mode === 'walk')
    .reduce((max, s) => Math.max(max, s.durationMin), 0)
  if (maxWalkSeg > maxWalkMinutes) base = Math.max(0, base - 40)

  return base
}

function mapItinerary(itin: OtpItinerary, idx: number, options: JourneyOptions): Journey {
  const segments: JourneySegment[] = itin.legs.map((leg): JourneySegment => {
    const mode = otpModeToTransportMode(leg.mode)
    const distKm = Math.round(
      (leg.distance !== undefined ? leg.distance / 1000 : haversineKm(leg.from, leg.to)) * 100,
    ) / 100
    const durationMin = Math.max(1, Math.round(leg.duration / 60))
    const co2g = Math.round(distKm * CO2_FACTORS[mode])

    const lineName = leg.routeShortName
      ? `${leg.routeShortName}${leg.headsign ? ` — ${leg.headsign}` : ''}`
      : undefined

    const shape = leg.legGeometry?.points
      ? decodePolyline(leg.legGeometry.points, leg.legGeometry.precision ?? 5)
      : undefined

    return {
      mode,
      from: { lat: leg.from.lat, lng: leg.from.lon },
      to:   { lat: leg.to.lat,   lng: leg.to.lon   },
      distanceKm: distKm,
      durationMin,
      co2g,
      ...(leg.routeShortName ? { lineRef: leg.routeShortName } : {}),
      ...(lineName            ? { lineName }                   : {}),
      ...(shape               ? { shape }                      : {}),
    }
  })

  const totalDurationMin  = Math.round(itin.duration / 60)
  const totalDistanceKm   = Math.round(segments.reduce((s, seg) => s + seg.distanceKm, 0) * 100) / 100
  const totalCo2g         = segments.reduce((s, seg) => s + seg.co2g, 0)
  const co2SavingG        = Math.max(0, Math.round(totalDistanceKm * CO2_FACTORS.car) - totalCo2g)

  const w             = scoringWeights(options.preference)
  const durationScore = Math.max(0, 100 - (totalDurationMin / 120) * 100)
  const maxCo2        = totalDistanceKm * CO2_FACTORS.car
  const co2Score      = maxCo2 > 0 ? Math.max(0, (1 - totalCo2g / maxCo2) * 100) : 100
  const comfort       = computeComfortScore(segments, options.modes ?? [], options.maxWalkMinutes ?? 30)
  const score         = Math.round(w.duration * durationScore + w.co2 * co2Score + w.comfort * comfort)

  const usedModes = [...new Set(segments.map((s) => s.mode))]
  const label     = usedModes.map(modeLabel).join(' + ')

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
  private readonly baseUrl = (process.env.TRANSITOUS_URL ?? 'https://api.transitous.org/api/').replace(/\/$/, '')

  async getJourneys(
    from: Coordinates,
    to: Coordinates,
    options: JourneyOptions,
  ): Promise<Journey[]> {
    const params = new URLSearchParams({
      fromPlace:      `${from.lat},${from.lng}`,
      toPlace:        `${to.lat},${to.lng}`,
      numItineraries: '5',
      arriveBy:       'false',
    })

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

    console.log('[routing] Transitous réponse brute :')
    console.log(JSON.stringify(raw, null, 2))

    if (raw.error) {
      throw new Error(`Transitous erreur : ${raw.error.message}`)
    }

    const itineraries = raw.itineraries ?? []
    const journeys = itineraries.map((itin, idx) => mapItinerary(itin, idx, options))
    console.log(`[routing] TransitousProvider: ${journeys.length} itinéraires mappés`)
    return journeys
  }
}
