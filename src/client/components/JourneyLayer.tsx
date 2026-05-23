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
  navibus: '#0ea5e9',
  train: '#7c3aed',
}

interface JourneyLayerProps {
  journey: Journey
  activeSegmentIdx?: number | null
}

export function JourneyLayer({ journey, activeSegmentIdx }: JourneyLayerProps) {
  const map = useMap()

  // Cadrage initial sur tout l'itinéraire
  useEffect(() => {
    if (activeSegmentIdx != null) return
    const points = journey.segments.flatMap((s) =>
      s.shape && s.shape.length >= 2
        ? s.shape.map((c) => L.latLng(c.lat, c.lng))
        : [L.latLng(s.from.lat, s.from.lng), L.latLng(s.to.lat, s.to.lng)]
    )
    if (points.length > 0) {
      map.fitBounds(L.latLngBounds(points), { padding: [48, 48] })
    }
  }, [journey, map, activeSegmentIdx])

  // Recentrage sur le segment actif
  useEffect(() => {
    if (activeSegmentIdx == null) return
    const seg = journey.segments[activeSegmentIdx]
    if (!seg) return
    const points =
      seg.shape && seg.shape.length >= 2
        ? seg.shape.map((c) => L.latLng(c.lat, c.lng))
        : [L.latLng(seg.from.lat, seg.from.lng), L.latLng(seg.to.lat, seg.to.lng)]
    map.fitBounds(L.latLngBounds(points), { padding: [60, 60], maxZoom: 16 })
  }, [activeSegmentIdx, journey, map])

  return (
    <>
      {journey.segments.map((segment, idx) => {
        const positions: [number, number][] =
          segment.shape && segment.shape.length >= 2
            ? segment.shape.map((c) => [c.lat, c.lng])
            : [
                [segment.from.lat, segment.from.lng],
                [segment.to.lat, segment.to.lng],
              ]

        const isActive = activeSegmentIdx == null || activeSegmentIdx === idx

        return (
          <Polyline
            key={idx}
            positions={positions}
            pathOptions={{
              color: MODE_COLORS[segment.mode],
              weight: activeSegmentIdx === idx ? 7 : segment.mode === 'walk' ? 3 : 5,
              opacity: isActive ? 0.9 : 0.2,
              dashArray: segment.mode === 'walk' ? '5 9' : undefined,
              lineCap: 'round',
              lineJoin: 'round',
            }}
          />
        )
      })}
    </>
  )
}
