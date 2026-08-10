import L from 'leaflet'
import { useEffect } from 'react'
import { Marker, Popup, useMap } from 'react-leaflet'
import type { Coordinates } from '@shared/types/index'

// Styles (.uf-location-dot / .uf-pulse-ring / .uf-pulse-dot) définis dans
// index.css § OVERRIDES LEAFLET — classes réelles plutôt qu'un <style> injecté
// dans document.head au montage, pour rester dans la cascade CSS (var() du
// thème clair/sombre) sans mutation DOM manuelle côté React.
const defaultIcon = L.divIcon({
  className: '',
  html: `<div class="uf-location-dot"></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
  popupAnchor: [0, -12],
})

const trackingIcon = L.divIcon({
  className: '',
  html: `<div style="position:relative;width:24px;height:24px;">
    <div class="uf-pulse-ring"></div>
    <div class="uf-pulse-dot"></div>
  </div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -14],
})

interface UserLocationMarkerProps {
  position: Coordinates
  isTracking?: boolean
}

export function UserLocationMarker({ position, isTracking = false }: UserLocationMarkerProps) {
  const map = useMap()

  useEffect(() => {
    map.setView([position.lat, position.lng], Math.max(map.getZoom(), 15))
  }, [map, position])

  return (
    <Marker
      position={[position.lat, position.lng]}
      icon={isTracking ? trackingIcon : defaultIcon}
      aria-label={isTracking ? 'Votre position — suivi actif' : 'Votre position actuelle'}
    >
      <Popup>
        <p className="font-medium text-text">{isTracking ? 'Suivi en cours' : 'Vous êtes ici'}</p>
      </Popup>
    </Marker>
  )
}
