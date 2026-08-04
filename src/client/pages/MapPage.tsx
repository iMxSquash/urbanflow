import 'leaflet/dist/leaflet.css'
import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { MapContainer, TileLayer } from 'react-leaflet'
import { useLocation } from 'react-router-dom'
import { BottomNav } from '../components/BottomNav'
import { ErrorBanner } from '../components/ErrorBanner'
import { GeolocationConsent } from '../components/GeolocationConsent'
import { EcoMapLayer } from '../components/EcoMapLayer'
import { JourneyLayer } from '../components/JourneyLayer'
import { JourneySummaryModal } from '../components/JourneySummaryModal'
import { MapLayerToggle } from '../components/MapLayerToggle'
import { MapSheet, type SearchOptions, type SheetState } from '../components/MapSheet'
import { TrackingConsentModal } from '../components/TrackingConsentModal'
import { TripToast } from '../components/TripToast'
import { UserLocationMarker } from '../components/UserLocationMarker'
import { OfflinePanel } from '../components/OfflinePanel'
import { useOnlineStatus } from '../hooks/useOnlineStatus'
import { saveLastJourney } from '../utils/last-journey-cache'
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
  const isOnline = useOnlineStatus()
  const { position: geoPosition, error: geoError, loading: geoLoading, locate } = useGeolocation()
  const [addressPosition, setAddressPosition] = useState<Coordinates | null>(null)
  const [fromLabel, setFromLabel] = useState<string | null>(null)
  const [toCoords, setToCoords] = useState<Coordinates | null>(null)
  const [toLabel, setToLabel] = useState<string | null>(null)
  // Une inversion départ/arrivée déplace la position GPS courante côté
  // arrivée : le départ devient une adresse fixe (l'ancienne arrivée), qui ne
  // doit plus être écrasée par le GPS tant qu'aucune nouvelle recherche n'a
  // été lancée depuis la carte (cf. handleSwapDirection).
  const [geoOverridden, setGeoOverridden] = useState(false)
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
    setEcoMapActive(true)
    setSheetState('mid')
  }, [location.state])

  // Position affichée : pendant le suivi on suit la position GPS temps réel
  const userPosition = geoOverridden ? addressPosition : (geoPosition ?? addressPosition)
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

  // Cache local du meilleur itinéraire — reste consultable hors ligne.
  useEffect(() => {
    if (journeys.length === 0 || !toLabel) return
    const best = journeys[0]
    saveLastJourney({
      fromLabel: geoPosition ? 'Ma position' : (fromLabel ?? 'Votre position'),
      toLabel,
      durationMin: best.totalDurationMin,
      co2SavedGrams: best.co2SavingG,
      savedAt: new Date().toISOString(),
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [journeys, toLabel])

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

  // Inverse départ et arrivée. L'ancien départ (GPS ou adresse) devient une
  // arrivée fixe ; l'ancienne arrivée devient le nouveau départ, qui doit
  // rester prioritaire sur le GPS (geoOverridden) sans quoi userPosition
  // reviendrait aussitôt à la position courante.
  function handleSwapDirection() {
    const prevFromCoords = userPosition
    const prevFromLabel = effectiveFromLabel
    const prevToCoords = toCoords
    const prevToLabel = toLabel

    setGeoOverridden(true)
    setAddressPosition(prevToCoords)
    setFromLabel(prevToLabel)
    setToCoords(prevFromCoords)
    setToLabel(prevFromLabel)
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
    setGeoOverridden(false)
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
      setGeoOverridden(false)
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

  const effectiveFromLabel = geoOverridden ? fromLabel : geoPosition ? 'Ma position' : fromLabel
  const showGeoError = !!geoError && !geoLoading && geolocationConsent !== 'denied'

  return (
    <div className="lg:flex lg:h-screen">
      {/* Sidebar desktop : masquée en mobile sauf sheet replié, où elle est le
       * bottom nav (comportement historique du sheet à 8 états, inchangé). En
       * desktop la sidebar est permanente, indépendante de l'état du sheet. */}
      <div className={sheetState === 'collapsed' ? '' : 'max-lg:hidden'}>
        <BottomNav />
      </div>

      {/* Pas de top app-bar : "la carte reste le sujet" (MAQUETTE.md §1). La
       * navigation passe entièrement par le bottom sheet et, pour Paramètres,
       * par le raccourci en tête du profil. */}
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
          setEcoMapActive(true)
        }}
        onSwap={handleSwapDirection}
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

      <div className="h-screen lg:h-auto lg:flex-1 lg:min-w-0">
        {/* Ne recouvre pas un suivi de trajet déjà en cours — le GPS et le
         * segment affiché ne dépendent pas du réseau une fois le trajet chargé. */}
        {!isOnline && trackingPhase !== 'active' && <OfflinePanel />}

        <main
          className="h-full relative overflow-hidden isolate"
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
              className="absolute top-3 left-1/2 -translate-x-1/2 z-1100 bg-surface rounded-full px-4 py-2 shadow-card flex items-center gap-2 text-body-sm text-text-muted whitespace-nowrap"
            >
              <div
                className="w-4 h-4 border-2 border-border border-t-eco-600 rounded-full animate-spin"
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
                className="btn-secondary text-caption px-3 shrink-0 bg-surface"
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
      </div>

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
