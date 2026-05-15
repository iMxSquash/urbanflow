import type { BiclooStation, Coordinates, Journey, JourneyOptions, JourneySegment, TransportMode } from '@shared/types/index.js'
import { CO2_FACTORS } from '@shared/constants/co2-factors.js'
import { computeScore } from '../../routing/scoring.service.js'
import { getBiclooStations } from '../bicloo.service.js'
import type { TransportProvider } from '../transport-provider.interface.js'

// ─── Types OSRM ───────────────────────────────────────────────────────────────

interface OsrmRoute {
  distance: number                           // mètres
  geometry: { coordinates: [number, number][] }
}
interface OsrmResponse { code: string; routes?: OsrmRoute[]; message?: string }

// ─── Constantes ───────────────────────────────────────────────────────────────

const OSRM_BASE = (process.env.OSRM_URL ?? 'http://router.project-osrm.org').replace(/\/$/, '')

// Vitesses réalistes par mode (km/h) — le serveur public ne charge que le profil
// driving, les durées retournées pour /cycling/ et /foot/ sont invalides.
const MODE_SPEED_KMH: Record<'bike' | 'walk', number> = { bike: 15, walk: 5 }

// ─── Helpers ──────────────────────────────────────────────────────────────────

function haversineKm(a: Coordinates, b: Coordinates): number {
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLon = ((b.lng - a.lng) * Math.PI) / 180
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
}

function nearestStation(
  stations: BiclooStation[],
  point: Coordinates,
  filter: (s: BiclooStation) => boolean,
): BiclooStation | null {
  return stations
    .filter(filter)
    .reduce<BiclooStation | null>((best, s) => {
      const d = haversineKm(point, s.coordinates)
      return best === null || d < haversineKm(point, best.coordinates) ? s : best
    }, null)
}

interface OsrmResult { shape: Coordinates[]; distKm: number }

async function fetchOsrmRoute(
  from: Coordinates,
  to: Coordinates,
  profile: 'cycling' | 'foot',
): Promise<OsrmResult> {
  const url =
    `${OSRM_BASE}/route/v1/${profile}/${from.lng},${from.lat};${to.lng},${to.lat}` +
    `?overview=full&geometries=geojson`

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10_000)
  try {
    const res = await fetch(url, { signal: controller.signal })
    clearTimeout(timeout)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const raw = (await res.json()) as OsrmResponse
    if (raw.code !== 'Ok' || !raw.routes?.length) throw new Error(raw.message ?? raw.code)
    const route = raw.routes[0]
    return {
      distKm: Math.round((route.distance / 1000) * 100) / 100,
      shape: route.geometry.coordinates.map(([lng, lat]) => ({ lat, lng })),
    }
  } catch {
    clearTimeout(timeout)
    // Fallback : distance haversine, tracé direct
    return { distKm: haversineKm(from, to), shape: [from, to] }
  }
}

function makeSegment(
  mode: TransportMode,
  from: Coordinates,
  to: Coordinates,
  distKm: number,
  opts: { lineName?: string; shape?: Coordinates[] },
): JourneySegment {
  const speed = MODE_SPEED_KMH[mode as 'bike' | 'walk'] ?? 5
  const durationMin = Math.max(1, Math.round((distKm / speed) * 60))
  const co2g = Math.round(distKm * CO2_FACTORS[mode])
  return {
    mode,
    from,
    to,
    distanceKm: Math.round(distKm * 100) / 100,
    durationMin,
    co2g,
    ...(opts.lineName ? { lineName: opts.lineName } : {}),
    ...(opts.shape    ? { shape: opts.shape }         : {}),
  }
}

// computeScore importé depuis scoring.service.ts

// ─── Journeys ─────────────────────────────────────────────────────────────────

async function buildBiclooJourney(
  from: Coordinates,
  to: Coordinates,
  options: JourneyOptions,
): Promise<Journey> {
  if (options.pmrAccessibility) {
    throw new Error('Vélo Bicloo non adapté aux besoins PMR')
  }

  const stations = await getBiclooStations()

  const depStation = nearestStation(stations, from, (s) => s.availableBikes > 0)
  const arrStation = nearestStation(stations, to,   (s) => s.availableDocks > 0)

  if (!depStation) throw new Error('Aucune station Bicloo avec vélos disponibles à proximité')
  if (!arrStation) throw new Error('Aucune station Bicloo avec places libres à destination')

  // Récupérer les shapes en parallèle (uniquement vélo — les marches sont courtes)
  const [bikeRoute] = await Promise.all([
    fetchOsrmRoute(depStation.coordinates, arrStation.coordinates, 'cycling'),
  ])

  const walkToDist   = haversineKm(from, depStation.coordinates)
  const walkFromDist = haversineKm(arrStation.coordinates, to)

  const segments: JourneySegment[] = [
    makeSegment('walk', from, depStation.coordinates, walkToDist, {
      lineName: `Vers ${depStation.name}`,
    }),
    makeSegment('bike', depStation.coordinates, arrStation.coordinates, bikeRoute.distKm, {
      lineName: `${depStation.name} → ${arrStation.name}`,
      shape: bikeRoute.shape.length >= 2 ? bikeRoute.shape : undefined,
    }),
    makeSegment('walk', arrStation.coordinates, to, walkFromDist, {
      lineName: `Depuis ${arrStation.name}`,
    }),
  ]

  const totalDurationMin  = segments.reduce((s, seg) => s + seg.durationMin, 0)
  const totalDistanceKm   = Math.round(segments.reduce((s, seg) => s + seg.distanceKm, 0) * 100) / 100
  const totalCo2g         = 0 // vélo + marche = 0 g CO2
  const co2SavingG        = Math.max(0, Math.round(totalDistanceKm * CO2_FACTORS.car))
  const score             = computeScore(segments, totalDurationMin, totalDistanceKm, totalCo2g, options)

  console.log(
    `[routing] OsrmProvider Bicloo: ${depStation.name} (${depStation.availableBikes} vélos) → ` +
    `${arrStation.name} (${arrStation.availableDocks} places) — ${totalDurationMin} min`
  )

  return {
    id: 'osrm-bicloo',
    label: 'Vélo Bicloo',
    segments,
    totalDurationMin,
    totalDistanceKm,
    totalCo2g,
    co2SavingG,
    score,
  }
}

async function buildWalkJourney(
  from: Coordinates,
  to: Coordinates,
  options: JourneyOptions,
): Promise<Journey> {
  const { distKm, shape } = await fetchOsrmRoute(from, to, 'foot')
  const segment = makeSegment('walk', from, to, distKm, {
    shape: shape.length >= 2 ? shape : undefined,
  })

  const totalDurationMin = segment.durationMin
  const totalDistanceKm  = segment.distanceKm
  const co2SavingG       = Math.max(0, Math.round(totalDistanceKm * CO2_FACTORS.car))
  const score            = computeScore([segment], totalDurationMin, totalDistanceKm, 0, options)

  return {
    id: 'osrm-walk',
    label: 'Marche',
    segments: [segment],
    totalDurationMin,
    totalDistanceKm,
    totalCo2g: 0,
    co2SavingG,
    score,
  }
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export class OsrmProvider implements TransportProvider {
  readonly supportedModes: TransportMode[] = ['bike', 'walk']

  async getJourneys(
    from: Coordinates,
    to: Coordinates,
    options: JourneyOptions,
  ): Promise<Journey[]> {
    const requestedModes = (options.modes ?? []).filter((m) =>
      this.supportedModes.includes(m)
    ) as Array<'bike' | 'walk'>

    // Si aucun mode spécifique → proposer le vélo par défaut
    const modes = requestedModes.length > 0 ? requestedModes : ['bike' as const]

    const tasks: Promise<Journey>[] = []
    if (modes.includes('bike')) tasks.push(buildBiclooJourney(from, to, options))
    if (modes.includes('walk')) tasks.push(buildWalkJourney(from, to, options))

    const results = await Promise.allSettled(tasks)
    const journeys: Journey[] = []
    for (const r of results) {
      if (r.status === 'fulfilled') journeys.push(r.value)
      else console.error('[routing] OsrmProvider error:', r.reason)
    }
    return journeys
  }
}
