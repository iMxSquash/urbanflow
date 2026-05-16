import { readFileSync } from 'node:fs'
import path from 'node:path'
import type { Coordinates, TanLine } from '@shared/types/index.js'

// Loaded once at first call, then kept in memory for the process lifetime
let _lines: TanLine[] | null = null

function getLines(): TanLine[] {
  if (_lines) return _lines
  const filePath = path.resolve(process.cwd(), 'src/demo-data/tan-lines.json')
  const data = JSON.parse(readFileSync(filePath, 'utf-8')) as { lines: TanLine[] }
  _lines = data.lines
  console.log(`[gtfs-shapes] ${_lines.length} lignes TAN chargées`)
  return _lines
}

function haversineKm(a: Coordinates, b: Coordinates): number {
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLon = ((b.lng - a.lng) * Math.PI) / 180
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
}

// Returns the index of the point in `line` closest to `point`
function closestIndex(line: [number, number][], point: Coordinates): number {
  let best = 0
  let bestDist = Infinity
  for (let i = 0; i < line.length; i++) {
    const d = haversineKm({ lat: line[i][1], lng: line[i][0] }, point)
    if (d < bestDist) {
      bestDist = d
      best = i
    }
  }
  return best
}

/**
 * Returns the sub-segment of the official TAN shape for `routeShortName`
 * between the two stops, or null if unavailable.
 *
 * When Transitous returns legGeometry with < 3 decoded points (straight line),
 * this provides a precise fallback from the GTFS MultiLineString data.
 */
export function getShapeForLeg(
  routeShortName: string,
  from: Coordinates,
  to: Coordinates
): Coordinates[] | null {
  const lines = getLines()
  const route = lines.find((l) => l.shortName === routeShortName)
  if (!route) return null

  let bestSlice: Coordinates[] | null = null
  let bestLen = 0

  for (const linestring of route.coordinates) {
    if (linestring.length < 2) continue

    const iFrom = closestIndex(linestring, from)
    const iTo = closestIndex(linestring, to)

    if (iFrom === iTo) continue

    const [start, end] = iFrom < iTo ? [iFrom, iTo] : [iTo, iFrom]
    const slice = linestring.slice(start, end + 1).map(([lng, lat]): Coordinates => ({ lat, lng }))

    // Preserve the from→to direction
    const ordered = iFrom < iTo ? slice : [...slice].reverse()

    if (ordered.length > bestLen) {
      bestLen = ordered.length
      bestSlice = ordered
    }
  }

  return bestSlice && bestSlice.length >= 3 ? bestSlice : null
}
