import L from 'leaflet'
import { useEffect } from 'react'
import { Marker, Popup, useMap } from 'react-leaflet'
import type { Coordinates } from '@shared/types/index'

const userIcon = L.divIcon({
  className: '',
  html: `<div style="
    width:18px;height:18px;border-radius:50%;
    background:#2563eb;border:3px solid white;
    box-shadow:0 0 0 5px rgba(37,99,235,0.2);
  "></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
  popupAnchor: [0, -12],
})

export function UserLocationMarker({ position }: { position: Coordinates }) {
  const map = useMap()

  useEffect(() => {
    map.setView([position.lat, position.lng], Math.max(map.getZoom(), 15))
  }, [map, position])

  return (
    <Marker
      position={[position.lat, position.lng]}
      icon={userIcon}
      aria-label="Votre position actuelle"
    >
      <Popup>
        <p className="font-medium text-slate-900">Vous êtes ici</p>
      </Popup>
    </Marker>
  )
}
