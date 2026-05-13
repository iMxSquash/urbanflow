import 'leaflet/dist/leaflet.css'
import { lazy, Suspense } from 'react'
import { MapContainer, TileLayer } from 'react-leaflet'
import { Link } from 'react-router-dom'
import LogoutButton from '../components/LogoutButton'

const BiclooLayer = lazy(() => import('../components/BiclooLayer'))

const NANTES_COMMERCE: [number, number] = [47.218, -1.553]
const CARTO_POSITRON = 'https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
const CARTO_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors ' +
  '&copy; <a href="https://carto.com/attributions">CARTO</a>'

export default function MapPage() {
  return (
    <div className="flex flex-col h-screen">
      <header className="h-16 bg-white border-b border-slate-200 px-4 flex items-center justify-between shrink-0 z-navbar">
        <span className="text-h3 font-bold text-slate-900">UrbanFlow</span>
        <nav className="flex items-center gap-2">
          <Link to="/profile" className="btn-secondary text-body-sm px-3">
            Mon profil
          </Link>
          <LogoutButton />
        </nav>
      </header>

      <main
        className="flex-1 relative overflow-hidden"
        role="application"
        aria-label="Carte de mobilité de Nantes"
      >
        <MapContainer
          center={NANTES_COMMERCE}
          zoom={13}
          className="h-full w-full"
          zoomControl
        >
          <TileLayer url={CARTO_POSITRON} attribution={CARTO_ATTRIBUTION} />
          <Suspense fallback={null}>
            <BiclooLayer />
          </Suspense>
        </MapContainer>
      </main>
    </div>
  )
}
