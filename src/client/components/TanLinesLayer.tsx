import { Polyline } from 'react-leaflet'
import { useTanLines } from '../hooks/useTanLines'

function hexToLeaflet(hex: string): string {
  return `#${hex.replace(/^#/, '')}`
}

export default function TanLinesLayer() {
  const { lines, error } = useTanLines()

  if (error) {
    console.warn('[TanLinesLayer] Lignes indisponibles :', error)
    return null
  }

  return (
    <>
      {lines.map((line) =>
        line.coordinates.map((segment, segIdx) => (
          <Polyline
            key={`${line.routeId}-${segIdx}`}
            positions={segment.map(([lng, lat]) => [lat, lng] as [number, number])}
            pathOptions={{
              color: hexToLeaflet(line.color),
              weight: line.routeType === 'Tramway' ? 4 : 2.5,
              opacity: 0.7,
              lineCap: 'round',
              lineJoin: 'round',
            }}
          />
        ))
      )}
    </>
  )
}
