import 'leaflet/dist/leaflet.css'
import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { MapContainer, TileLayer } from 'react-leaflet'
import { Link, useLocation } from 'react-router-dom'
import { ErrorBanner } from '../components/ErrorBanner'
import { GeolocationConsent } from '../components/GeolocationConsent'
import { EcoMapLayer } from '../components/EcoMapLayer'
import { JourneyLayer } from '../components/JourneyLayer'
import { JourneySummaryModal } from '../components/JourneySummaryModal'
import { MapLayerToggle } from '../components/MapLayerToggle'
import { MapSheet, type SearchOptions, type SheetState } from '../components/MapSheet'
import LogoutButton from '../components/LogoutButton'
import { TrackingConsentModal } from '../components/TrackingConsentModal'
import { TripToast } from '../components/TripToast'
import { UserLocationMarker } from '../components/UserLocationMarker'
import { recordTrip } from '../services/gamification.service'
import type { RecordTripResult } from '../services/gamification.service'
import { useGamificationStore } from '../stores/gamification.store'
import { useActiveTracking } from '../hooks/useActiveTracking'
import { useGeolocation } from '../hooks/useGeolocation'
import { useJourney } from '../hooks/useJourney'
import { useWeather } from '../hooks/useWeather'
import { useConsentStore } from '../stores/consent.store'
import { useMapLayersStore } from '../stores/map-layers.store'
import { useProfileStore } from '../stores/profile.store'
import { WeatherBadge } from '../components/WeatherBadge'
import type { Coordinates, TransportMode } from '@shared/types/index'

const BiclooLayer = lazy(() => import('../components/BiclooLayer'))
const TanLinesLayer = lazy(() => import('../components/TanLinesLayer'))
const TanStopsLayer = lazy(() => import('../components/TanStopsLayer'))

const NANTES_COMMERCE: [number, number] = [47.218, -1.553]
const NANTES_FALLBACK_COORDS = { lat: 47.218, lng: -1.553 }
const CARTO_POSITRON = 'https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
const CARTO_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors ' +
  '&copy; <a href="https://carto.com/attributions">CARTO</a>'

const DEFAULT_MODES: TransportMode[] = ['walk', 'tramway', 'bus']

// Phase du parcours de suivi — distincte de l'état du sheet (SheetState) : ce
// state pilote les modales portées hors du sheet (consentement, résumé).
type TrackingModalPhase = 'idle' | 'consent' | 'active' | 'done'

interface DemoScenarioState {
  from: Coordinates
  to: Coordinates
  fromLabel: string
  toLabel: string
}

interface ActiveTrackingState {
  startTime: number
  destination: Coordinates
}

export default function MapPage() {
  const { geolocationConsent, grantGeolocation, denyGeolocation } = useConsentStore()
  const { position: geoPosition, error: geoError, loading: geoLoading, locate } = useGeolocation()
  const [addressPosition, setAddressPosition] = useState<Coordinates | null>(null)
  const [fromLabel, setFromLabel] = useState<string | null>(null)
  const [toCoords, setToCoords] = useState<Coordinates | null>(null)
  const [toLabel, setToLabel] = useState<string | null>(null)
  const [sheetState, setSheetState] = useState<SheetState>('collapsed')
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

  const [options, setOptions] = useState<SearchOptions>(() => ({
    preference: 'balanced',
    modes: DEFAULT_MODES,
    maxWalkMinutes: 15,
    pmrAccessibility: false,
    avoidElevation: false,
    datetime: new Date(),
    datetimeType: 'departure',
  }))
  const profileSyncedRef = useRef(false)

  // Tracking (modale hors sheet)
  const [trackingPhase, setTrackingPhase] = useState<TrackingModalPhase>('idle')
  const [activeTracking, setActiveTracking] = useState<ActiveTrackingState | null>(null)
  const [summaryResult, setSummaryResult] = useState<RecordTripResult | null>(null)
  const [summaryDurationMin, setSummaryDurationMin] = useState(0)
  const arrivalHandledRef = useRef(false)

  const location = useLocation()
  const locatedOnMount = useRef(false)
  const scenarioApplied = useRef(false)

  // Destination for tracking — stable fallback when no journey selected (hook must be unconditional)
  const trackingDestination = activeTracking?.destination ?? NANTES_FALLBACK_COORDS

  const {
    position: trackingPosition,
    arrived,
    stop: stopTracking,
  } = useActiveTracking({
    destination: trackingDestination,
    active: trackingPhase === 'active',
  })

  useEffect(() => {
    void fetchProfile()
  }, [fetchProfile])

  useEffect(() => {
    if (geolocationConsent === 'granted' && !locatedOnMount.current) {
      locatedOnMount.current = true
      locate()
    }
  }, [geolocationConsent, locate])

  // Réglages de recherche : initialisés une fois depuis le profil persistant,
  // puis modifiables localement sans jamais réécrire le profil (override par
  // recherche — cf. MIGRATION-TODO.md étape 2).
  useEffect(() => {
    if (!profile || profileSyncedRef.current) return
    profileSyncedRef.current = true
    setOptions((o) => ({
      ...o,
      preference: profile.preference,
      modes: profile.preferredModes,
      maxWalkMinutes: profile.maxWalkMinutes,
      pmrAccessibility: profile.pmrAccessibility,
    }))
  }, [profile])

  // Scénario démo
  useEffect(() => {
    const state = (location.state as { demoScenario?: DemoScenarioState } | null)?.demoScenario
    if (!state || scenarioApplied.current) return
    scenarioApplied.current = true
    setAddressPosition(state.from)
    setFromLabel(state.fromLabel)
    setToCoords(state.to)
    setToLabel(state.toLabel)
    setSheetState('mid')
  }, [location.state])

  // Position affichée : pendant le suivi on suit la position GPS temps réel
  const userPosition = geoPosition ?? addressPosition
  const displayPosition =
    trackingPhase === 'active' ? (trackingPosition ?? userPosition) : userPosition

  // Calcul automatique dès que départ + arrivée sont connus, et à chaque
  // changement de réglages (modes, PMR, marche max, dénivelé, horaire).
  useEffect(() => {
    if (!userPosition || !toCoords) return
    void calculate(
      userPosition,
      toCoords,
      {
        preference: options.preference,
        preferredModes: options.modes,
        maxWalkMinutes: options.maxWalkMinutes,
        pmrAccessibility: options.pmrAccessibility,
        avoidElevation: options.avoidElevation,
      },
      options.datetime,
      options.datetimeType
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userPosition, toCoords, options])

  // Détection d'arrivée
  useEffect(() => {
    if (!arrived || trackingPhase !== 'active' || arrivalHandledRef.current) return
    arrivalHandledRef.current = true
    void handleArrival()
  }, [arrived, trackingPhase]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleGrant() {
    locatedOnMount.current = true
    grantGeolocation()
    locate()
  }

  // "Partir maintenant" → ouvre la modale de consentement suivi
  function handleDepartClick() {
    setTrackingPhase('consent')
  }

  // L'utilisateur accepte le suivi GPS continu
  function handleStartTracking() {
    if (!selectedJourney) return
    const destination = selectedJourney.segments.at(-1)!.to
    arrivalHandledRef.current = false
    setActiveTracking({ startTime: Date.now(), destination })
    setTrackingPhase('active')
    setSheetState('tracking')
  }

  // L'utilisateur refuse le suivi → enregistrement immédiat sans points
  async function handleSkipTracking() {
    setTrackingPhase('idle')
    if (!selectedJourney) return
    const { segments } = selectedJourney
    const origin = segments[0].from
    const destination = segments[segments.length - 1].to
    try {
      const result = await recordTrip(origin, destination, segments, false)
      setTripResult(result)
      useGamificationStore.getState().setTripResult(result.totalPoints, result.newlyUnlockedBadges)
    } catch {
      // Le toast ne s'affiche pas en cas d'erreur réseau — pas de crash UI
    }
  }

  // Fin de trajet : arrivée auto ou clic "Terminer"
  async function handleArrival() {
    if (!selectedJourney || !activeTracking) return
    stopTracking()
    const realDurationMin = Math.round((Date.now() - activeTracking.startTime) / 60_000)
    const { segments } = selectedJourney
    const origin = segments[0].from
    const destination = segments[segments.length - 1].to
    try {
      const result = await recordTrip(origin, destination, segments)
      useGamificationStore.getState().setTripResult(result.totalPoints, result.newlyUnlockedBadges)
      setSummaryResult(result)
      setSummaryDurationMin(Math.max(1, realDurationMin))
    } catch {
      // Échec silencieux : le résumé ne s'affiche pas mais le tracking est bien arrêté
    }
    setTrackingPhase('done')
    setActiveTracking(null)
  }

  // Fin manuelle via "Terminer le trajet"
  function handleEndTrip() {
    void handleArrival()
  }

  // Fermeture du résumé de fin de trajet — retour à un état replié propre
  function handleSummaryClose() {
    setSummaryResult(null)
    setActiveSegmentIdx(null)
    deselectJourney()
    clearJourney()
    setAddressPosition(null)
    setFromLabel(null)
    setToCoords(null)
    setToLabel(null)
    setSheetState('collapsed')
  }

  // Fermeture du panneau détail/suivi : abandon complet si suivi actif,
  // sinon retour aux résultats (l'itinéraire reste calculé).
  function handleClosePanel() {
    if (trackingPhase === 'active') {
      stopTracking()
      setActiveTracking(null)
      setTrackingPhase('idle')
      clearJourney()
      setAddressPosition(null)
      setFromLabel(null)
      setToCoords(null)
      setToLabel(null)
      setSheetState('collapsed')
    } else {
      setActiveSegmentIdx(null)
      deselectJourney()
      setSheetState('results')
    }
  }

  const defaultOptions: SearchOptions = {
    preference: profile?.preference ?? 'balanced',
    modes: profile?.preferredModes ?? DEFAULT_MODES,
    maxWalkMinutes: profile?.maxWalkMinutes ?? 15,
    pmrAccessibility: profile?.pmrAccessibility ?? false,
    avoidElevation: false,
    datetime: new Date(),
    datetimeType: 'departure',
  }

  const effectiveFromLabel = geoPosition ? 'Ma position' : fromLabel
  const showGeoError = !!geoError && !geoLoading && geolocationConsent !== 'denied'

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
            to="/rewards"
            aria-label="Boutique de récompenses"
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
              <rect x="3" y="8" width="18" height="13" rx="1" />
              <path d="M3 8h18M12 8v13M7.5 8a2.5 2.5 0 0 1 0-5C9 3 12 5 12 8M16.5 8a2.5 2.5 0 0 0 0-5C15 3 12 5 12 8" />
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
        {weather && (
          <div className="absolute top-3 right-3 z-1100">
            <WeatherBadge weather={weather} variant="map" />
          </div>
        )}

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
          {displayPosition && (
            <UserLocationMarker
              position={displayPosition}
              isTracking={trackingPhase === 'active'}
            />
          )}
          {ecoMapActive && journeys.length > 0 && (
            <EcoMapLayer
              journeys={journeys}
              selectedJourneyId={selectedJourney?.id}
              onSelect={(journey) => {
                setActiveSegmentIdx(null)
                selectJourney(journey)
              }}
            />
          )}
          {selectedJourney && !ecoMapActive && (
            <JourneyLayer journey={selectedJourney} activeSegmentIdx={activeSegmentIdx} />
          )}
        </MapContainer>

        <MapLayerToggle
          hasJourney={journeys.length > 0 || !!selectedJourney}
          ecoMapActive={ecoMapActive}
          onToggleEco={() => setEcoMapActive((v) => !v)}
        />

        <MapSheet
          state={sheetState}
          onStateChange={setSheetState}
          fromLabel={effectiveFromLabel}
          toLabel={toLabel}
          hasFrom={!!userPosition}
          onFromSelect={(c, label) => {
            setAddressPosition(c)
            setFromLabel(label)
          }}
          onToSelect={(c, label) => {
            setToCoords(c)
            setToLabel(label)
          }}
          options={options}
          defaultOptions={defaultOptions}
          onOptionsChange={setOptions}
          journeys={journeys}
          journeyLoading={journeyLoading}
          journeyError={journeyError}
          selectedJourney={selectedJourney}
          onSelectJourney={selectJourney}
          onClosePanel={handleClosePanel}
          activeSegmentIdx={activeSegmentIdx}
          onSegmentSelect={setActiveSegmentIdx}
          trackingPhase={trackingPhase === 'active' ? 'active' : 'idle'}
          weather={weather}
          onDepartClick={handleDepartClick}
          onEndTrip={handleEndTrip}
        />

        {/* Toast confirmation départ sans suivi */}
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

      {/* Modale consentement géolocalisation initiale */}
      {geolocationConsent === null &&
        createPortal(
          <GeolocationConsent onGrant={handleGrant} onDeny={denyGeolocation} />,
          document.body
        )}

      {/* Modale consentement suivi continu */}
      {trackingPhase === 'consent' &&
        createPortal(
          <TrackingConsentModal
            onAccept={handleStartTracking}
            onSkip={() => void handleSkipTracking()}
          />,
          document.body
        )}

      {/* Résumé final après arrivée (état 8 — modale centrée) */}
      {trackingPhase === 'done' &&
        summaryResult &&
        selectedJourney &&
        createPortal(
          <JourneySummaryModal
            journey={selectedJourney}
            realDurationMin={summaryDurationMin}
            tripResult={summaryResult}
            onClose={handleSummaryClose}
          />,
          document.body
        )}
    </div>
  )
}
