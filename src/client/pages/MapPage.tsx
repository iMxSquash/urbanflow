import 'leaflet/dist/leaflet.css'
import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { MapContainer, TileLayer } from 'react-leaflet'
import { Link, useLocation } from 'react-router-dom'
import { AddressSearch } from '../components/AddressSearch'
import { ErrorBanner } from '../components/ErrorBanner'
import { GeolocationConsent } from '../components/GeolocationConsent'
import { EcoMapLayer } from '../components/EcoMapLayer'
import { JourneyLayer } from '../components/JourneyLayer'
import { JourneyPanel } from '../components/JourneyPanel'
import { JourneyResults } from '../components/JourneyResults'
import { MapLayerToggle } from '../components/MapLayerToggle'
import LogoutButton from '../components/LogoutButton'
import { TripToast } from '../components/TripToast'
import { UserLocationMarker } from '../components/UserLocationMarker'
import { recordTrip } from '../services/gamification.service'
import type { RecordTripResult } from '../services/gamification.service'
import { useGamificationStore } from '../stores/gamification.store'
import { useGeolocation } from '../hooks/useGeolocation'
import { useJourney } from '../hooks/useJourney'
import { useWeather } from '../hooks/useWeather'
import { useConsentStore } from '../stores/consent.store'
import { useMapLayersStore } from '../stores/map-layers.store'
import { useProfileStore } from '../stores/profile.store'
import { WeatherBadge } from '../components/WeatherBadge'
import type { Coordinates } from '@shared/types/index'

const BiclooLayer = lazy(() => import('../components/BiclooLayer'))
const TanLinesLayer = lazy(() => import('../components/TanLinesLayer'))
const TanStopsLayer = lazy(() => import('../components/TanStopsLayer'))

const NANTES_COMMERCE: [number, number] = [47.218, -1.553]
const CARTO_POSITRON = 'https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
const CARTO_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors ' +
  '&copy; <a href="https://carto.com/attributions">CARTO</a>'

interface DemoScenarioState {
  from: Coordinates
  to: Coordinates
  fromLabel: string
  toLabel: string
}

export default function MapPage() {
  const { geolocationConsent, grantGeolocation, denyGeolocation } = useConsentStore()
  const { position: geoPosition, error: geoError, loading: geoLoading, locate } = useGeolocation()
  const [addressPosition, setAddressPosition] = useState<Coordinates | null>(null)
  const {
    journeys,
    selectedJourney,
    loading: journeyLoading,
    error: journeyError,
    calculate,
    select: selectJourney,
    deselect: deselectJourney,
    clear: clearJourney,
  } = useJourney()
  const { layers } = useMapLayersStore()
  const { profile, fetchProfile } = useProfileStore()
  const { weather, error: weatherError, loading: weatherLoading } = useWeather()
  const [activeSegmentIdx, setActiveSegmentIdx] = useState<number | null>(null)
  const [ecoMapActive, setEcoMapActive] = useState(false)
  const [tripResult, setTripResult] = useState<RecordTripResult | null>(null)
  const location = useLocation()
  const locatedOnMount = useRef(false)
  const scenarioApplied = useRef(false)

  useEffect(() => {
    void fetchProfile()
  }, [fetchProfile])

  // Si le consentement était déjà accordé (session persistée), localiser au mount
  useEffect(() => {
    if (geolocationConsent === 'granted' && !locatedOnMount.current) {
      locatedOnMount.current = true
      locate()
    }
  }, [geolocationConsent, locate])

  // Scénario démo : pré-remplit origine + destination et déclenche le calcul
  useEffect(() => {
    const state = (location.state as { demoScenario?: DemoScenarioState } | null)?.demoScenario
    if (!state || scenarioApplied.current) return
    scenarioApplied.current = true
    setAddressPosition(state.from)
    void calculate(
      state.from,
      state.to,
      profile
        ? {
            preference: profile.preference,
            preferredModes: profile.preferredModes,
            maxWalkMinutes: profile.maxWalkMinutes,
            pmrAccessibility: profile.pmrAccessibility,
          }
        : undefined
    )
  }, [location.state, calculate, profile])

  function handleGrant() {
    locatedOnMount.current = true // empêche le useEffect de rappeler locate()
    grantGeolocation()
    locate()
  }

  function handleDestinationSelect(dest: Coordinates) {
    if (!userPosition) return
    void calculate(
      userPosition,
      dest,
      profile
        ? {
            preference: profile.preference,
            preferredModes: profile.preferredModes,
            maxWalkMinutes: profile.maxWalkMinutes,
            pmrAccessibility: profile.pmrAccessibility,
          }
        : undefined
    )
  }

  async function handleDepart() {
    if (!selectedJourney) return
    const { segments } = selectedJourney
    const origin = segments[0].from
    const destination = segments[segments.length - 1].to
    const result = await recordTrip(origin, destination, segments)
    setTripResult(result)
    useGamificationStore.getState().setTripResult(result.totalPoints, result.newlyUnlockedBadges)
  }

  // Position effective : géoloc en priorité, sinon adresse saisie manuellement
  const userPosition = geoPosition ?? addressPosition

  const showAddressSearch = geolocationConsent === 'denied' && !geoPosition
  const showGeoError = !!geoError && !geoLoading && geolocationConsent !== 'denied'
  // Barre de destination : visible dès qu'on a une position et qu'aucun résultat n'est affiché
  const showDestSearch =
    !!userPosition && journeys.length === 0 && !selectedJourney && !journeyLoading
  // Reserve right-edge space for the weather badge so search bars don't overlap it
  const searchRight = weather ? 'right-24 sm:right-36' : 'right-3'

  return (
    <div className="flex flex-col h-screen">
      <header className="h-16 bg-white border-b border-slate-200 px-4 flex items-center justify-between shrink-0 z-navbar">
        <span className="text-h3 font-bold text-slate-900">UrbanFlow</span>
        <nav className="flex items-center gap-2">
          <Link to="/profile" className="btn-secondary text-body-sm px-3">
            Mon profil
          </Link>
          <Link
            to="/dashboard"
            aria-label="Tableau de bord"
            className="w-10 h-10 flex items-center justify-center rounded-button text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors duration-fast"
          >
            <svg
              aria-hidden="true"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
          </Link>
          <Link
            to="/parametres"
            aria-label="Paramètres"
            className="w-10 h-10 flex items-center justify-center rounded-button text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors duration-fast"
          >
            <svg
              aria-hidden="true"
              width="18"
              height="18"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
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
        {/* Barre de départ (consentement refusé, pas encore de position) */}
        {showAddressSearch && (
          <div className={`absolute top-3 left-3 ${searchRight} z-1100`}>
            <AddressSearch onSelect={setAddressPosition} />
          </div>
        )}

        {/* Barre de destination */}
        {showDestSearch && (
          <div
            className={[
              `absolute left-3 ${searchRight} z-1100`,
              showAddressSearch ? 'top-16' : 'top-3',
            ].join(' ')}
          >
            <AddressSearch onSelect={handleDestinationSelect} placeholder="Où allez-vous ?" />
          </div>
        )}

        {/* Badge météo — top-right, visible en permanence */}
        {weather && (
          <div className="absolute top-3 right-3 z-1100">
            <WeatherBadge weather={weather} variant="map" />
          </div>
        )}

        {/* Indicateur de calcul d'itinéraire */}
        {journeyLoading && (
          <div
            role="status"
            aria-label="Calcul de l'itinéraire en cours"
            className="absolute top-3 left-1/2 -translate-x-1/2 z-1100 bg-white rounded-full px-4 py-2 shadow-card flex items-center gap-2 text-body-sm text-slate-600 whitespace-nowrap"
          >
            <div
              className="w-4 h-4 border-2 border-slate-200 border-t-eco-600 rounded-full animate-spin"
              aria-hidden="true"
            />
            Calcul de l'itinéraire…
          </div>
        )}

        {/* Bannière d'erreur itinéraire */}
        {journeyError && !journeyLoading && (
          <div className="absolute top-3 left-3 right-3 z-1100">
            <ErrorBanner message={journeyError} onClose={clearJourney} />
          </div>
        )}

        {/* Indicateur de localisation en cours */}
        {geoLoading && (
          <div
            role="status"
            aria-label="Localisation en cours"
            className="absolute top-3 left-1/2 -translate-x-1/2 z-1100 bg-white rounded-full px-4 py-2 shadow-card flex items-center gap-2 text-body-sm text-slate-600 whitespace-nowrap"
          >
            <div
              className="w-4 h-4 border-2 border-slate-200 border-t-eco-600 rounded-full animate-spin"
              aria-hidden="true"
            />
            Localisation en cours…
          </div>
        )}

        {/* Bannière d'erreur géolocalisation */}
        {showGeoError && geoError && (
          <div className="absolute top-3 left-3 right-3 z-1100 flex items-start gap-2">
            <div className="flex-1">
              <ErrorBanner message={geoError} onRetry={locate} />
            </div>
            <button
              type="button"
              onClick={denyGeolocation}
              className="btn-secondary text-caption px-3 shrink-0 bg-white"
              style={{ minHeight: '44px' }}
            >
              Saisir une adresse
            </button>
          </div>
        )}

        {/* Bannière d'erreur météo */}
        {weatherError && !weatherLoading && !weather && (
          <div className="absolute top-3 right-3 z-1100 w-72">
            <ErrorBanner message="Météo indisponible" />
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
          {layers.tanLines && (
            <Suspense fallback={null}>
              <TanLinesLayer />
            </Suspense>
          )}
          {layers.tanStops && (
            <Suspense fallback={null}>
              <TanStopsLayer />
            </Suspense>
          )}
          {layers.bikesharing && (
            <Suspense fallback={null}>
              <BiclooLayer />
            </Suspense>
          )}
          {userPosition && <UserLocationMarker position={userPosition} />}
          {ecoMapActive && journeys.length > 0 && (
            <EcoMapLayer
              journeys={journeys}
              selectedJourneyId={selectedJourney?.id}
              onSelect={selectJourney}
            />
          )}
          {selectedJourney && !ecoMapActive && (
            <JourneyLayer journey={selectedJourney} activeSegmentIdx={activeSegmentIdx} />
          )}
        </MapContainer>

        {/* Sélecteur de calques */}
        <MapLayerToggle
          hasJourney={journeys.length > 0 || !!selectedJourney}
          ecoMapActive={ecoMapActive}
          onToggleEco={() => setEcoMapActive((v) => !v)}
        />

        {/* Résultats — comparaison des itinéraires avant sélection */}
        {journeys.length > 0 && !selectedJourney && (
          <div
            className={[
              'absolute z-1100 bg-white overflow-y-auto',
              'bottom-0 left-0 right-0 max-h-[60vh] rounded-t-2xl',
              'shadow-[0_-8px_32px_rgba(0,0,0,0.12)]',
              'lg:top-0 lg:right-0 lg:bottom-0 lg:left-auto lg:w-80 lg:max-h-none lg:rounded-none',
              'lg:shadow-[-8px_0_32px_rgba(0,0,0,0.08)]',
            ].join(' ')}
            role="complementary"
            aria-label="Résultats des itinéraires"
          >
            <div className="flex justify-center pt-3 lg:hidden" aria-hidden="true">
              <div className="w-8 h-1 bg-slate-200 rounded-full" />
            </div>
            <div className="p-4 lg:p-5">
              <JourneyResults journeys={journeys} onSelect={selectJourney} onClose={clearJourney} />
            </div>
          </div>
        )}

        {/* Panneau détail — après sélection d'un itinéraire */}
        {selectedJourney && (
          <JourneyPanel
            journey={selectedJourney}
            onClose={() => {
              setActiveSegmentIdx(null)
              deselectJourney()
            }}
            onDepart={handleDepart}
            weather={weather}
            activeSegmentIdx={activeSegmentIdx}
            onSegmentSelect={setActiveSegmentIdx}
          />
        )}

        {/* Toast confirmation départ */}
        {tripResult && (
          <TripToast
            co2SavedGrams={tripResult.co2SavedGrams}
            pointsEarned={tripResult.pointsEarned}
            totalPoints={tripResult.totalPoints}
            newlyUnlockedBadges={tripResult.newlyUnlockedBadges}
            onClose={() => setTripResult(null)}
          />
        )}
      </main>

      {/* Modale de consentement RGPD — portail dans <body> pour échapper au stacking context Leaflet */}
      {geolocationConsent === null &&
        createPortal(
          <GeolocationConsent onGrant={handleGrant} onDeny={denyGeolocation} />,
          document.body
        )}
    </div>
  )
}
