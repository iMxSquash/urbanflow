import { useEffect, useState } from 'react'
import { CircleMarker, Popup, useMap } from 'react-leaflet'
import { useTanStops } from '../hooks/useTanStops'

const MIN_ZOOM = 14

function StopPopup({ name, wheelchairBoarding }: { name: string; wheelchairBoarding: boolean }) {
  return (
    <div className="min-w-32">
      <p className="font-semibold text-text text-sm">{name}</p>
      {wheelchairBoarding && <p className="text-caption text-text-subtle mt-1">Accessible PMR</p>}
    </div>
  )
}

export default function TanStopsLayer() {
  const { stops, error } = useTanStops()
  const map = useMap()
  const [zoom, setZoom] = useState(() => map.getZoom())

  useEffect(() => {
    function onZoom() {
      setZoom(map.getZoom())
    }
    map.on('zoomend', onZoom)
    return () => {
      map.off('zoomend', onZoom)
    }
  }, [map])

  if (error) {
    console.warn('[TanStopsLayer] Arrêts indisponibles :', error)
    return null
  }

  if (zoom < MIN_ZOOM) return null

  return (
    <>
      {stops.map((stop) => (
        <CircleMarker
          key={stop.stopId}
          center={[stop.coordinates.lat, stop.coordinates.lng]}
          radius={4}
          pathOptions={{
            className: 'tan-stop-marker',
            fillOpacity: 1,
            weight: 2,
          }}
          aria-label={`Arrêt ${stop.name}`}
        >
          <Popup>
            <StopPopup name={stop.name} wheelchairBoarding={stop.wheelchairBoarding} />
          </Popup>
        </CircleMarker>
      ))}
    </>
  )
}
