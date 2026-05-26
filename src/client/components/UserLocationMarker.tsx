import L from 'leaflet'
import { useEffect } from 'react'
import { Marker, Popup, useMap } from 'react-leaflet'
import type { Coordinates } from '@shared/types/index'

const defaultIcon = L.divIcon({
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

// Pulsing icon injected once per page load — style tag is safe here (not user-controlled)
const PULSE_STYLE_ID = 'uf-tracking-pulse-style'
if (!document.getElementById(PULSE_STYLE_ID)) {
  const style = document.createElement('style')
  style.id = PULSE_STYLE_ID
  style.textContent = `
    @keyframes uf-pulse {
      0%   { transform: scale(1); opacity: 0.6; }
      70%  { transform: scale(2.8); opacity: 0; }
      100% { transform: scale(1); opacity: 0; }
    }
    .uf-pulse-ring {
      position: absolute; inset: 0; border-radius: 50%;
      background: rgba(37,99,235,0.3);
      animation: uf-pulse 2s ease-out infinite;
    }
    .uf-pulse-dot {
      position: absolute; top: 50%; left: 50%;
      transform: translate(-50%, -50%);
      width: 16px; height: 16px; border-radius: 50%;
      background: #2563eb; border: 3px solid white;
      box-shadow: 0 2px 6px rgba(37,99,235,0.55);
    }
  `
  document.head.appendChild(style)
}

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
        <p className="font-medium text-slate-900">
          {isTracking ? 'Suivi en cours' : 'Vous êtes ici'}
        </p>
      </Popup>
    </Marker>
  )
}
