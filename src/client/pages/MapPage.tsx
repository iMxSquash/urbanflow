import 'leaflet/dist/leaflet.css'
import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { MapContainer, TileLayer } from 'react-leaflet'
import { Link } from 'react-router-dom'
import { AddressSearch } from '../components/AddressSearch'
import { GeolocationConsent } from '../components/GeolocationConsent'
import LogoutButton from '../components/LogoutButton'
import { UserLocationMarker } from '../components/UserLocationMarker'
import { useGeolocation } from '../hooks/useGeolocation'
import { useConsentStore } from '../stores/consent.store'
import type { Coordinates } from '@shared/types/index'

const BiclooLayer = lazy(() => import('../components/BiclooLayer'))

const NANTES_COMMERCE: [number, number] = [47.218, -1.553]
const CARTO_POSITRON = 'https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
const CARTO_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors ' +
  '&copy; <a href="https://carto.com/attributions">CARTO</a>'

export default function MapPage() {
  const { geolocationConsent, grantGeolocation, denyGeolocation } = useConsentStore()
  const { position: geoPosition, error: geoError, loading: geoLoading, locate } = useGeolocation()
  const [addressPosition, setAddressPosition] = useState<Coordinates | null>(null)
  const locatedOnMount = useRef(false)

  // Si le consentement était déjà accordé (session persistée), localiser au mount
  useEffect(() => {
    if (geolocationConsent === 'granted' && !locatedOnMount.current) {
      locatedOnMount.current = true
      locate()
    }
  }, [geolocationConsent, locate])

  function handleGrant() {
    locatedOnMount.current = true // empêche le useEffect de rappeler locate()
    grantGeolocation()
    locate()
  }

  // Position effective : géoloc en priorité, sinon adresse saisie manuellement
  const userPosition = geoPosition ?? addressPosition

  const showAddressSearch = geolocationConsent === 'denied' && !geoPosition
  const showGeoError = !!geoError && !geoLoading && geolocationConsent !== 'denied'

  return (
    <div className="flex flex-col h-screen">
      <header className="h-16 bg-white border-b border-slate-200 px-4 flex items-center justify-between shrink-0 z-navbar">
        <span className="text-h3 font-bold text-slate-900">UrbanFlow</span>
        <nav className="flex items-center gap-2">
          <Link to="/profile" className="btn-secondary text-body-sm px-3">
            Mon profil
          </Link>
          <Link to="/parametres" aria-label="Paramètres" className="w-10 h-10 flex items-center justify-center rounded-button text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors duration-fast">
            <svg aria-hidden="true" width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="10" cy="10" r="3" />
              <path d="M10 2v1.5M10 16.5V18M2 10h1.5M16.5 10H18M4.22 4.22l1.06 1.06M14.72 14.72l1.06 1.06M4.22 15.78l1.06-1.06M14.72 5.28l1.06-1.06" />
            </svg>
          </Link>
          <LogoutButton />
        </nav>
      </header>

      <main
        className="flex-1 relative overflow-hidden isolate"
        role="application"
        aria-label="Carte de mobilité de Nantes"
      >
        {/* Barre de recherche d'adresse (consentement refusé) */}
        {showAddressSearch && (
          <div className="absolute top-3 left-3 right-3 z-[1100]">
            <AddressSearch onSelect={setAddressPosition} />
          </div>
        )}

        {/* Indicateur de localisation en cours */}
        {geoLoading && (
          <div
            role="status"
            aria-label="Localisation en cours"
            className="absolute top-3 left-1/2 -translate-x-1/2 z-[1100] bg-white rounded-full px-4 py-2 shadow-card flex items-center gap-2 text-body-sm text-slate-600 whitespace-nowrap"
          >
            <div className="w-4 h-4 border-2 border-slate-200 border-t-eco-600 rounded-full animate-spin" aria-hidden="true" />
            Localisation en cours…
          </div>
        )}

        {/* Bannière d'erreur géolocalisation */}
        {showGeoError && (
          <div
            role="alert"
            className="absolute top-3 left-3 right-3 z-[1100] bg-white rounded-card shadow-card-md border border-red-100 px-4 py-3 flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-2 text-body-sm text-red-600 min-w-0">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0" aria-hidden="true">
                <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
                <path d="M8 4.5v4M8 10.5v1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <span className="truncate">{geoError}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={locate}
                className="btn-secondary text-caption px-3"
                style={{ minHeight: '36px' }}
              >
                Réessayer
              </button>
              <button
                type="button"
                onClick={denyGeolocation}
                className="btn-ghost text-caption px-3"
                style={{ minHeight: '36px' }}
              >
                Saisir une adresse
              </button>
            </div>
          </div>
        )}

        <MapContainer
          center={NANTES_COMMERCE}
          zoom={13}
          className="h-full w-full"
          zoomControl={false}
          attributionControl={false}
        >
          <TileLayer url={CARTO_POSITRON} attribution={CARTO_ATTRIBUTION} />
          <Suspense fallback={null}>
            <BiclooLayer />
          </Suspense>
          {userPosition && <UserLocationMarker position={userPosition} />}
        </MapContainer>
      </main>

      {/* Modale de consentement RGPD — portail dans <body> pour échapper au stacking context Leaflet */}
      {geolocationConsent === null &&
        createPortal(
          <GeolocationConsent onGrant={handleGrant} onDeny={denyGeolocation} />,
          document.body,
        )}
    </div>
  )
}
