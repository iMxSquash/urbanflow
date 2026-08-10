import 'leaflet/dist/leaflet.css'
import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { MapContainer, TileLayer } from 'react-leaflet'
import { useLocation } from 'react-router-dom'
import { BottomNav } from '../components/BottomNav'
import { ErrorBanner } from '../components/ErrorBanner'
import { GeolocationConsent } from '../components/GeolocationConsent'
import { EcoMapLayer } from '../components/EcoMapLayer'
import { EndTripConfirmModal } from '../components/EndTripConfirmModal'
import { JourneyLayer } from '../components/JourneyLayer'
import { JourneySummaryModal } from '../components/JourneySummaryModal'
import { MapLayerToggle } from '../components/MapLayerToggle'
import { MapResizeSync } from '../components/MapResizeSync'
import { MapSheet, type SearchOptions, type SheetState } from '../components/MapSheet'
import { TrackingConsentModal } from '../components/TrackingConsentModal'
import { TripToast } from '../components/TripToast'
import { UserLocationMarker } from '../components/UserLocationMarker'
import { OfflinePanel } from '../components/OfflinePanel'
import { useOnlineStatus } from '../hooks/use-online-status'
import { saveLastJourney } from '../utils/last-journey-cache'
import { recordGeolocationConsent } from '../services/auth.service'
import { useGeolocation } from '../hooks/use-geolocation'
import { useIsDarkMode } from '../hooks/use-is-dark-mode'
import { useJourney } from '../hooks/use-journey'
import { useTripTracking } from '../hooks/use-trip-tracking'
import { useWeather } from '../hooks/use-weather'
import { useConsentStore } from '../stores/consent.store'
import { useMapLayersStore } from '../stores/map-layers.store'
import { useProfileStore } from '../stores/profile.store'
import { WeatherBadge } from '../components/WeatherBadge'
import type { Coordinates, Journey, TransportMode } from '@shared/types/index'

const BiclooLayer = lazy(() => import('../components/BiclooLayer'))
const TanLinesLayer = lazy(() => import('../components/TanLinesLayer'))
const TanStopsLayer = lazy(() => import('../components/TanStopsLayer'))

const NANTES_COMMERCE: [number, number] = [47.218, -1.553]
const NANTES_FALLBACK_COORDS = { lat: 47.218, lng: -1.553 }
const CARTO_POSITRON_LIGHT = 'https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
const CARTO_POSITRON_DARK = 'https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
const CARTO_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors ' +
  '&copy; <a href="https://carto.com/attributions">CARTO</a>'

const DEFAULT_MODES: TransportMode[] = ['walk', 'tramway', 'bus']

interface DemoScenarioState {
  from: Coordinates
  to: Coordinates
  fromLabel: string
  toLabel: string
}

export default function MapPage() {
  const { geolocationConsent, grantGeolocation, denyGeolocation } = useConsentStore()
  const isOnline = useOnlineStatus()
  const isDarkMode = useIsDarkMode()
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
  // Rétrécissement manuel mobile (bouton poignée) — n'affecte pas `sheetState`,
  // mais la nav doit réapparaître comme en `collapsed` (MIGRATION-TODO.md
  // étape 6). Reporté par `MapSheet` via `onMobileMinimizedChange`.
  const [sheetMinimized, setSheetMinimized] = useState(false)
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

  const tracking = useTripTracking({
    selectedJourney,
    fallbackDestination: NANTES_FALLBACK_COORDS,
  })

  const location = useLocation()
  const locatedOnMount = useRef(false)
  const scenarioApplied = useRef(false)

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
    tracking.trackingPhase === 'active' ? (tracking.trackingPosition ?? userPosition) : userPosition

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

  function handleGrant() {
    locatedOnMount.current = true
    grantGeolocation()
    void recordGeolocationConsent()
    locate()
  }

  // L'utilisateur accepte le suivi GPS continu — la machine à états du suivi
  // vit dans useTripTracking, seul le sheet reste piloté depuis MapPage.
  function handleStartTracking() {
    tracking.start()
    setSheetState('tracking')
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

  // Réinitialisation complète de la recherche en cours (départ/arrivée,
  // trajets calculés) — partagée entre la fin de trajet et la croix
  // "Annuler la recherche" du sheet (MIGRATION-TODO.md étape 6).
  function resetSearch() {
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

  // Fermeture du résumé de fin de trajet — retour à un état replié propre
  function handleSummaryClose() {
    tracking.closeSummary()
    resetSearch()
  }

  // Sélection d'un trajet (depuis la liste du sheet ou en tapant directement
  // une ligne sur la carte comparative) : on quitte le mode carte éco pour
  // n'afficher que le trajet choisi (`JourneyLayer`), plus la comparaison
  // (`EcoMapLayer`).
  function handleSelectJourney(journey: Journey) {
    selectJourney(journey)
    setEcoMapActive(false)
  }

  // Fermeture du panneau détail/suivi : abandon complet si suivi actif,
  // sinon retour aux résultats (l'itinéraire reste calculé, on revient à la
  // comparaison éco puisqu'il n'y a plus de trajet unique affiché).
  function handleClosePanel() {
    if (tracking.trackingPhase === 'active') {
      tracking.abort()
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
      setEcoMapActive(true)
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
  // Nav mobile visible en `collapsed`/`mid` (MAQUETTE.md §5.2 états 1 et 3,
  // "3 · Mi-hauteur" inclut la nav dans la maquette), en `search`/`results`
  // (demandé explicitement, absents de la maquette mais utiles pour ne pas
  // s'y sentir bloqué) et quand le sheet est réduit manuellement, quel que
  // soit l'état sous-jacent.
  const showBottomNav =
    sheetState === 'collapsed' ||
    sheetState === 'mid' ||
    sheetState === 'search' ||
    sheetState === 'results' ||
    sheetMinimized

  return (
    <div className="lg:flex lg:h-screen">
      {/* Sidebar desktop : masquée en mobile sauf sheet replié/mi-hauteur/réduit,
       * où elle est le bottom nav. En desktop la sidebar est permanente,
       * indépendante de l'état du sheet. */}
      <div className={showBottomNav ? '' : 'max-lg:hidden'}>
        <BottomNav />
      </div>

      {/* Pas de top app-bar : "la carte reste le sujet" (MAQUETTE.md §1). La
       * navigation passe entièrement par le bottom sheet et, pour Paramètres,
       * par le raccourci en tête du profil. */}
      <MapSheet
        state={sheetState}
        onStateChange={setSheetState}
        fromLabel={effectiveFromLabel}
        fromCoords={userPosition}
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
        onCancelSearch={resetSearch}
        onMobileMinimizedChange={setSheetMinimized}
        options={options}
        defaultOptions={defaultOptions}
        onOptionsChange={setOptions}
        journeys={journeys}
        journeyLoading={journeyLoading}
        journeyError={journeyError}
        selectedJourney={selectedJourney}
        onSelectJourney={handleSelectJourney}
        onClosePanel={handleClosePanel}
        activeSegmentIdx={activeSegmentIdx}
        onSegmentSelect={setActiveSegmentIdx}
        trackingPhase={tracking.trackingPhase === 'active' ? 'active' : 'idle'}
        weather={weather}
        onDepartClick={tracking.openConsent}
        onEndTrip={tracking.requestEndTrip}
      />

      <div className="h-screen lg:h-auto lg:flex-1 lg:min-w-0">
        {/* Ne recouvre pas un suivi de trajet déjà en cours — le GPS et le
         * segment affiché ne dépendent pas du réseau une fois le trajet chargé. */}
        {!isOnline && tracking.trackingPhase !== 'active' && <OfflinePanel />}

        <main
          className="h-full relative overflow-hidden isolate group"
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
            <TileLayer
              key={isDarkMode ? 'dark' : 'light'}
              url={isDarkMode ? CARTO_POSITRON_DARK : CARTO_POSITRON_LIGHT}
              attribution={CARTO_ATTRIBUTION}
              className={isDarkMode ? 'saturate-[.5] brightness-[.92]' : 'saturate-[.55] contrast-[1.02]'}
            />
            <MapResizeSync />
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
                isTracking={tracking.trackingPhase === 'active'}
              />
            )}
            {ecoMapActive && journeys.length > 0 && (
              <EcoMapLayer
                journeys={journeys}
                selectedJourneyId={selectedJourney?.id}
                onSelect={(journey) => {
                  setActiveSegmentIdx(null)
                  handleSelectJourney(journey)
                }}
              />
            )}
            {selectedJourney && !ecoMapActive && (
              <JourneyLayer journey={selectedJourney} activeSegmentIdx={activeSegmentIdx} />
            )}
          </MapContainer>

          {/* Teinte de survol carte (DESIGN-SYSTEM.md / MAQUETTE.md §6). Les tuiles
           * Leaflet sont des <img> (élément remplacé) : ::after n'y a aucun effet, donc
           * pas de teinte tuile par tuile en CSS pur — un calque plein cadre en
           * mix-blend-mode au-dessus de la carte reproduit le même rendu. */}
          <div
            aria-hidden="true"
            className={
              isDarkMode
                ? 'absolute inset-0 pointer-events-none opacity-0 mix-blend-screen bg-primary-surface transition-opacity duration-fast group-hover:opacity-30'
                : 'absolute inset-0 pointer-events-none opacity-0 mix-blend-multiply bg-primary transition-opacity duration-fast group-hover:opacity-10'
            }
          />

          <MapLayerToggle
            hasJourney={journeys.length > 0 || !!selectedJourney}
            ecoMapActive={ecoMapActive}
            onToggleEco={() => setEcoMapActive((v) => !v)}
          />

          {/* Toast confirmation départ sans suivi */}
          {tracking.tripResult && (
            <TripToast
              co2SavedGrams={tracking.tripResult.co2SavedGrams}
              pointsEarned={tracking.tripResult.pointsEarned}
              totalPoints={tracking.tripResult.totalPoints}
              newlyUnlockedBadges={tracking.tripResult.newlyUnlockedBadges}
              onClose={tracking.dismissTripToast}
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
      {tracking.trackingPhase === 'consent' &&
        createPortal(
          <TrackingConsentModal
            onAccept={handleStartTracking}
            onSkip={() => void tracking.skip()}
          />,
          document.body
        )}

      {/* Résumé final après arrivée (état 8 — modale centrée) */}
      {tracking.trackingPhase === 'done' &&
        tracking.summaryResult &&
        selectedJourney &&
        createPortal(
          <JourneySummaryModal
            journey={selectedJourney}
            realDurationMin={tracking.summaryDurationMin}
            tripResult={tracking.summaryResult}
            onClose={handleSummaryClose}
          />,
          document.body
        )}

      {/* Confirmation avant d'arrêter le suivi actif ("Terminer le trajet") */}
      {tracking.showEndTripConfirm &&
        createPortal(
          <EndTripConfirmModal
            onCancel={tracking.cancelEndTripConfirm}
            onConfirm={tracking.confirmEndTrip}
          />,
          document.body
        )}
    </div>
  )
}
