import { readFile } from 'node:fs/promises'
import path from 'node:path'
import type { BiclooStation } from '@shared/types/index.js'

const NANTES_BICLOO_BASE =
  'https://data.nantesmetropole.fr/api/explore/v2.1/catalog/datasets/' +
  '244400404_disponibilite-temps-reel-velos-libre-service-naolib-nantes-metropole/records'

interface NantesStation {
  number: string
  name: string
  address: string
  available_bikes: string
  available_bike_stands: string
  bike_stands: number
  position: { lat: number; lon: number }
}

interface NantesResponse {
  total_count: number
  results: NantesStation[]
}

export async function getBiclooStations(): Promise<BiclooStation[]> {
  if (process.env.DEMO_MODE === 'true') {
    return readDemoStations()
  }
  return fetchFromNantes()
}

async function readDemoStations(): Promise<BiclooStation[]> {
  const filePath = path.resolve(process.cwd(), 'src/demo-data/stations-bicloo.json')
  const raw = await readFile(filePath, 'utf-8')
  const parsed = JSON.parse(raw) as { stations: BiclooStation[] }
  return parsed.stations
}

async function fetchPage(offset: number): Promise<NantesResponse> {
  const url = `${NANTES_BICLOO_BASE}?limit=100&offset=${offset}`
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`API Nantes Métropole indisponible (${res.status})`)
  }
  return res.json() as Promise<NantesResponse>
}

async function fetchFromNantes(): Promise<BiclooStation[]> {
  const first = await fetchPage(0)
  const remaining = first.total_count - first.results.length

  const extra = remaining > 0 ? await fetchPage(100) : { results: [] as NantesStation[] }

  return [...first.results, ...extra.results].map(
    (s): BiclooStation => ({
      id: `bicloo-${s.number}`,
      name: s.name,
      coordinates: { lat: s.position.lat, lng: s.position.lon },
      availableBikes: parseInt(s.available_bikes, 10),
      availableDocks: parseInt(s.available_bike_stands, 10),
      totalDocks: s.bike_stands,
    })
  )
}
