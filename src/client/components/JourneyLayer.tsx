import L from 'leaflet'
import { useEffect } from 'react'
import { Polyline, useMap } from 'react-leaflet'
import type { Journey, TransportMode } from '@shared/types/index'

const MODE_COLORS: Record<TransportMode, string> = {
  walk: '#94a3b8',
  bike: '#16a34a',
  tramway: '#6366f1',
  bus: '#f59e0b',
  scooter: '#0891b2',
}

export function JourneyLayer({ journey }: { journey: Journey }) {
  const map = useMap()

  useEffect(() => {
    const points = journey.segments.flatMap((s) => [
      L.latLng(s.from.lat, s.from.lng),
      L.latLng(s.to.lat, s.to.lng),
    ])
    if (points.length > 0) {
      map.fitBounds(L.latLngBounds(points), { padding: [48, 48] })
    }
  }, [journey, map])

  return (
    <>
      {journey.segments.map((segment, idx) => (
        <Polyline
          key={idx}
          positions={[
            [segment.from.lat, segment.from.lng],
            [segment.to.lat, segment.to.lng],
          ]}
          pathOptions={{
            color: MODE_COLORS[segment.mode],
            weight: segment.mode === 'walk' ? 3 : 5,
            opacity: 0.9,
            dashArray: segment.mode === 'walk' ? '5 9' : undefined,
            lineCap: 'round',
            lineJoin: 'round',
          }}
        />
      ))}
    </>
  )
}
