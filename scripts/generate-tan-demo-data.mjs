// Régénère src/demo-data/tan-lines.json et tan-stops.json depuis le GTFS officiel
// Naolib (data.nantesmetropole.fr). Le dataset "tan-circuits"/"tan-arrets" interrogeable
// par enregistrement a été retiré de l'API — seul cet export GTFS zip subsiste.
// À relancer manuellement quand le GTFS change (péremption ~2x/an, cf. calendar.txt).
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const NANTES_BASE = 'https://data.nantesmetropole.fr/api/explore/v2.1/catalog/datasets'
const GTFS_DATASET = '244400404_transports_commun_naolib_nantes_metropole_gtfs'

const ROUTE_TYPE_LABEL = { '0': 'Tramway', '3': 'Bus', '4': 'Navibus' }
const SHAPES_PER_ROUTE = 2 // outbound + inbound, cf. sélection par fréquence de trips

function parseCsv(text) {
  const rows = []
  let row = []
  let field = ''
  let inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i++
        } else inQuotes = false
      } else field += c
    } else if (c === '"') inQuotes = true
    else if (c === ',') {
      row.push(field)
      field = ''
    } else if (c === '\n') {
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else if (c !== '\r') field += c
  }
  if (field.length || row.length) {
    row.push(field)
    rows.push(row)
  }
  return rows
}

function parseCsvFile(path) {
  const [header, ...rows] = parseCsv(readFileSync(path, 'utf-8'))
  return rows.filter((r) => r.length === header.length).map((r) => Object.fromEntries(header.map((h, i) => [h, r[i]])))
}

async function downloadGtfsZip(destPath) {
  const recordsUrl = `${NANTES_BASE}/${GTFS_DATASET}/records?limit=1`
  const recordsRes = await fetch(recordsUrl)
  if (!recordsRes.ok) throw new Error(`API Nantes ${recordsRes.status} (records ${GTFS_DATASET})`)
  const records = await recordsRes.json()
  const fileUrl = records.results?.[0]?.fichier?.url
  if (!fileUrl) throw new Error('Aucun fichier GTFS trouvé sur le dataset Nantes')

  const zipRes = await fetch(fileUrl)
  if (!zipRes.ok) throw new Error(`Téléchargement GTFS échoué : HTTP ${zipRes.status}`)
  writeFileSync(destPath, Buffer.from(await zipRes.arrayBuffer()))
}

function buildLines(routesRows, tripsRows, shapesRows) {
  const shapeCoords = new Map() // shape_id -> [lng, lat][]
  for (const s of shapesRows) {
    const list = shapeCoords.get(s.shape_id) ?? []
    list.push([Number(s.shape_pt_lon), Number(s.shape_pt_lat), Number(s.shape_pt_sequence)])
    shapeCoords.set(s.shape_id, list)
  }
  for (const list of shapeCoords.values()) list.sort((a, b) => a[2] - b[2])

  const shapeCountByRoute = new Map() // route_id -> Map<shape_id, tripCount>
  for (const t of tripsRows) {
    const byShape = shapeCountByRoute.get(t.route_id) ?? new Map()
    byShape.set(t.shape_id, (byShape.get(t.shape_id) ?? 0) + 1)
    shapeCountByRoute.set(t.route_id, byShape)
  }

  return routesRows
    .filter((r) => r.route_type in ROUTE_TYPE_LABEL)
    .map((r) => {
      const byShape = shapeCountByRoute.get(r.route_id) ?? new Map()
      const topShapeIds = [...byShape.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, SHAPES_PER_ROUTE)
        .map(([shapeId]) => shapeId)

      const coordinates = topShapeIds
        .map((id) => shapeCoords.get(id)?.map(([lng, lat]) => [lng, lat]))
        .filter((line) => line && line.length >= 2)

      return {
        routeId: r.route_id,
        shortName: r.route_short_name,
        longName: r.route_long_name,
        routeType: ROUTE_TYPE_LABEL[r.route_type],
        color: r.route_color || '888888',
        coordinates,
      }
    })
    .filter((l) => l.coordinates.length > 0)
}

function buildStops(stopsRows) {
  return stopsRows
    .filter((s) => s.location_type === '0' && s.stop_lat && s.stop_lon)
    .map((s) => ({
      stopId: s.stop_id,
      name: s.stop_name,
      coordinates: { lat: Number(s.stop_lat), lng: Number(s.stop_lon) },
      wheelchairBoarding: s.wheelchair_boarding === '1',
    }))
}

const workDir = mkdtempSync(join(tmpdir(), 'naolib-gtfs-'))
try {
  const zipPath = join(workDir, 'gtfs.zip')
  console.log('Téléchargement du GTFS officiel Naolib…')
  await downloadGtfsZip(zipPath)

  console.log('Extraction routes.txt, trips.txt, shapes.txt, stops.txt…')
  execFileSync('unzip', ['-o', zipPath, 'routes.txt', 'trips.txt', 'shapes.txt', 'stops.txt', '-d', workDir])

  const routesRows = parseCsvFile(join(workDir, 'routes.txt'))
  const tripsRows = parseCsvFile(join(workDir, 'trips.txt'))
  const shapesRows = parseCsvFile(join(workDir, 'shapes.txt'))
  const stopsRows = parseCsvFile(join(workDir, 'stops.txt'))

  const lines = buildLines(routesRows, tripsRows, shapesRows)
  const stops = buildStops(stopsRows)

  writeFileSync('src/demo-data/tan-lines.json', JSON.stringify({ lines }, null, 2))
  writeFileSync('src/demo-data/tan-stops.json', JSON.stringify({ stops }, null, 2))

  console.log(`${lines.length} lignes (${lines.filter((l) => l.routeType === 'Tramway').length} tramway, ${lines.filter((l) => l.routeType === 'Navibus').length} navibus, ${lines.filter((l) => l.routeType === 'Bus').length} bus) et ${stops.length} arrêts écrits.`)
} finally {
  rmSync(workDir, { recursive: true, force: true })
}
