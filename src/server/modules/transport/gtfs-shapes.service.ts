import type { Coordinates, TanLine } from '@shared/types/index.js'
import { getTanLines } from './tan.service.js'
import { haversineKm } from '../../utils/geo.js'

// Caching the promise (not the result) ensures concurrent callers await the
// same in-flight build rather than each triggering a separate getTanLines() call.
let _indexPromise: Promise<Map<string, TanLine>> | null = null

function getIndex(): Promise<Map<string, TanLine>> {
  if (!_indexPromise) {
    _indexPromise = getTanLines()
      .then((lines) => new Map(lines.map((l) => [l.shortName, l])))
      .catch((err: unknown) => {
        _indexPromise = null // reset so the next call can retry
        throw err
      })
  }
  return _indexPromise
}

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

function extractSlice(route: TanLine, from: Coordinates, to: Coordinates): Coordinates[] | null {
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

/**
 * Returns the sub-segment of the official TAN shape for `routeShortName`
 * between the two stops, or null if unavailable.
 *
 * Delegates to getTanLines() which handles DEMO_MODE vs live API and
 * holds its own module-level cache — no local readFileSync needed.
 */
export async function getShapeForLeg(
  routeShortName: string,
  from: Coordinates,
  to: Coordinates
): Promise<Coordinates[] | null> {
  try {
    const index = await getIndex()
    const route = index.get(routeShortName)
    if (!route) return null
    return extractSlice(route, from, to)
  } catch (err) {
    console.warn(
      `[gtfs-shapes] fallback ignoré pour ${routeShortName} :`,
      err instanceof Error ? err.message : String(err)
    )
    return null
  }
}
