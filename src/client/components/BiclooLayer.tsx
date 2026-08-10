import L from 'leaflet'
import { Marker, Popup } from 'react-leaflet'
import type { BiclooStation } from '@shared/types/index'
import { useBiclooStations } from '../hooks/use-bicloo-stations'

// Un <div> Leaflet (`divIcon`) est du HTML réel, pas un attribut de présentation
// SVG : `style="background:var(...)"` inline y résout `var()` normalement, donc
// pas besoin de détection de thème JS ici (contrairement aux tracés SVG de
// JourneyLayer/TanStopsLayer, cf. index.css § OVERRIDES LEAFLET).
function makeIcon(availableBikes: number): L.DivIcon {
  // Vélo dispo → teinte du mode Bicloo ; aucun vélo → gris de référence
  // "--color-mode-car" (jamais sélectionnable comme mode, mais déjà le gris
  // neutre de la palette Estuaire).
  const color = availableBikes > 0 ? 'var(--color-mode-bike)' : 'var(--color-mode-car)'
  return L.divIcon({
    className: '',
    html: `<div style="
      width:32px;height:32px;border-radius:50%;
      background:${color};border:2.5px solid var(--color-surface);
      box-shadow:0 2px 6px rgba(0,0,0,.25);
      display:flex;align-items:center;justify-content:center;
      font-size:12px;font-weight:700;color:var(--color-on-primary);font-family:sans-serif;
      line-height:1;
    ">${availableBikes}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -20],
  })
}

function StationPopup({ station }: { station: BiclooStation }) {
  const available = station.availableBikes > 0

  return (
    <div className="min-w-40">
      <p className="font-semibold text-text mb-2">{station.name}</p>
      <div className="flex flex-col gap-1 text-body-sm text-text-muted">
        <span className={available ? 'text-eco-700 font-medium' : 'text-text-subtle'}>
          {station.availableBikes} vélo{station.availableBikes !== 1 ? 's' : ''} disponible
          {station.availableBikes !== 1 ? 's' : ''}
        </span>
        <span>
          {station.availableDocks} place{station.availableDocks !== 1 ? 's' : ''} libre
          {station.availableDocks !== 1 ? 's' : ''}
        </span>
        <span className="text-text-subtle text-caption">
          {station.totalDocks} emplacements au total
        </span>
      </div>
    </div>
  )
}

export default function BiclooLayer() {
  const { stations, error } = useBiclooStations()

  if (error) {
    console.warn('[BiclooLayer] Stations indisponibles :', error)
    return null
  }

  return (
    <>
      {stations.map((station) => (
        <Marker
          key={station.id}
          position={[station.coordinates.lat, station.coordinates.lng]}
          icon={makeIcon(station.availableBikes)}
          aria-label={`Station Bicloo ${station.name} — ${station.availableBikes} vélos disponibles`}
        >
          <Popup>
            <StationPopup station={station} />
          </Popup>
        </Marker>
      ))}
    </>
  )
}
