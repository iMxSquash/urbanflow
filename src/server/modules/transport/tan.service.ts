import { readFile } from 'node:fs/promises'
import path from 'node:path'
import type { TanLine, TanStop } from '@shared/types/index.js'
import { isDemoMode } from '../demo/demo-config.js'

const NANTES_BASE = (
  process.env.NANTES_API_URL ?? 'https://data.nantesmetropole.fr/api/explore/v2.1/catalog/datasets'
).replace(/\/$/, '')

// Module-level cache — GTFS data is static, cache for the process lifetime
let linesCache: TanLine[] | null = null
let stopsCache: TanStop[] | null = null

// ─── Lines ────────────────────────────────────────────────────────────────────

interface RawCircuit {
  route_id: string
  route_short_name: string
  route_long_name: string
  route_type: string
  route_color: string | null
  shape?: { geometry?: { coordinates?: [number, number][][] } }
}

interface NantesPage<T> {
  results?: T[]
  total_count?: number
}

async function fetchPage<T>(url: string): Promise<T[]> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 10_000)
  try {
    const res = await fetch(url, { signal: controller.signal })
    if (!res.ok) throw new Error(`API Nantes ${res.status}`)
    const d = (await res.json()) as NantesPage<T>
    return d.results ?? []
  } finally {
    clearTimeout(timer)
  }
}

async function fetchAllLines(): Promise<TanLine[]> {
  const base = `${NANTES_BASE}/244400404_tan-circuits/records`
  const [p1, p2] = await Promise.all([
    fetchPage<RawCircuit>(`${base}?limit=100&offset=0`),
    fetchPage<RawCircuit>(`${base}?limit=100&offset=100`),
  ])
  return [...p1, ...p2].map(
    (r): TanLine => ({
      routeId: r.route_id,
      shortName: r.route_short_name,
      longName: r.route_long_name,
      routeType: r.route_type ?? 'Bus',
      color: r.route_color ?? '888888',
      coordinates: r.shape?.geometry?.coordinates ?? [],
    })
  )
}

// ─── Stops ────────────────────────────────────────────────────────────────────

interface RawArret {
  stop_id: string
  stop_name: string
  stop_coordinates?: { lat: number; lon: number }
  wheelchair_boarding?: string
}

async function fetchAllStops(): Promise<TanStop[]> {
  const base = `${NANTES_BASE}/244400404_tan-arrets/records`
  const TOTAL = 2576
  const PAGE = 100
  const pages = Math.ceil(TOTAL / PAGE)

  const fetches = Array.from({ length: pages }, (_, i) =>
    fetchPage<RawArret>(`${base}?limit=${PAGE}&offset=${i * PAGE}&refine=location_type:0`)
  )
  const results = await Promise.all(fetches)
  return results.flat().flatMap((r): TanStop[] => {
    const c = r.stop_coordinates
    if (!c?.lat || !c?.lon) return []
    return [
      {
        stopId: r.stop_id,
        name: r.stop_name,
        coordinates: { lat: c.lat, lng: c.lon },
        wheelchairBoarding: r.wheelchair_boarding === '1',
      },
    ]
  })
}

// ─── Public API ───────────────────────────────────────────────────────────────

async function readDemoLines(): Promise<TanLine[]> {
  const filePath = path.resolve(process.cwd(), 'src/demo-data/tan-lines.json')
  const raw = await readFile(filePath, 'utf-8')
  return (JSON.parse(raw) as { lines: TanLine[] }).lines
}

async function readDemoStops(): Promise<TanStop[]> {
  const filePath = path.resolve(process.cwd(), 'src/demo-data/tan-stops.json')
  const raw = await readFile(filePath, 'utf-8')
  return (JSON.parse(raw) as { stops: TanStop[] }).stops
}

export async function getTanLines(): Promise<TanLine[]> {
  if (linesCache) return linesCache
  const lines = isDemoMode() ? await readDemoLines() : await fetchAllLines()
  linesCache = lines
  return lines
}

export async function getTanStops(): Promise<TanStop[]> {
  if (stopsCache) return stopsCache
  const stops = isDemoMode() ? await readDemoStops() : await fetchAllStops()
  stopsCache = stops
  return stops
}
