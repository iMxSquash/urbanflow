import L from 'leaflet'
import { Marker, Popup } from 'react-leaflet'
import type { BiclooStation } from '@shared/types/index'
import { useBiclooStations } from '../hooks/useBiclooStations'

function makeIcon(availableBikes: number): L.DivIcon {
  const color = availableBikes > 0 ? '#16a34a' : '#94a3b8'
  return L.divIcon({
    className: '',
    html: `<div style="
      width:32px;height:32px;border-radius:50%;
      background:${color};border:2.5px solid #fff;
      box-shadow:0 2px 6px rgba(0,0,0,.25);
      display:flex;align-items:center;justify-content:center;
      font-size:12px;font-weight:700;color:#fff;font-family:sans-serif;
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
      <p className="font-semibold text-slate-900 mb-2">{station.name}</p>
      <div className="flex flex-col gap-1 text-body-sm text-slate-600">
        <span className={available ? 'text-eco-700 font-medium' : 'text-slate-400'}>
          {station.availableBikes} vélo{station.availableBikes !== 1 ? 's' : ''} disponible{station.availableBikes !== 1 ? 's' : ''}
        </span>
        <span>
          {station.availableDocks} place{station.availableDocks !== 1 ? 's' : ''} libre{station.availableDocks !== 1 ? 's' : ''}
        </span>
        <span className="text-slate-400 text-caption">
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
