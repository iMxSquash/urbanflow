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
import { useOnlineStatus } from '../hooks/use-online-status'
import { saveLastJourney } from '../utils/last-journey-cache'
import { recordGeolocationConsent } from '../services/auth.service'
import { useGeolocation } from '../hooks/use-geolocation'
import { resolveOrigin, resolveOriginLabel, useOriginState } from '../hooks/use-origin-state'
import { useGuestSafeEffect } from '../hooks/use-guest-safe-effect'
import { useIsDarkMode } from '../hooks/use-is-dark-mode'
import { useJourney } from '../hooks/use-journey'
import { useTripTracking } from '../hooks/use-trip-tracking'
import { useWeather } from '../hooks/use-weather'
import { useAuthStore } from '../stores/auth.store'
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
const CARTO_API_KEY = import.meta.env.VITE_CARTO_API_KEY
const CARTO_POSITRON_LIGHT = `https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png?key=${CARTO_API_KEY}`
const CARTO_POSITRON_DARK = `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png?key=${CARTO_API_KEY}`
const CARTO_SUBDOMAINS = 'abcd'
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
  const isGuest = useAuthStore((s) => s.isGuest)
  const { geolocationConsent, grantGeolocation, denyGeolocation } = useConsentStore()
  const { isOnline, recheck: recheckOnlineStatus } = useOnlineStatus()
  const isDarkMode = useIsDarkMode()
  const { position: geoPosition, error: geoError, loading: geoLoading, locate } = useGeolocation()
  const [origin, dispatchOrigin] = useOriginState()
  const [toCoords, setToCoords] = useState<Coordinates | null>(null)
  const [toLabel, setToLabel] = useState<string | null>(null)
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
  // Rouvre la modale de consentement à la demande ("Ma position") quand le
  // consentement n'est pas déjà `granted` — indépendant de l'ouverture
  // automatique ci-dessous (`geolocationConsent === null`), qui ne couvre
  // que le tout premier passage.
  const [showLocateConsent, setShowLocateConsent] = useState(false)

  useGuestSafeEffect(fetchProfile, [fetchProfile])

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
    dispatchOrigin({ type: 'set', coords: state.from, label: state.fromLabel })
    setToCoords(state.to)
    setToLabel(state.toLabel)
    setEcoMapActive(true)
    setSheetState('mid')
  }, [location.state, dispatchOrigin])

  // Position affichée : pendant le suivi on suit la position GPS temps réel
  const userPosition = resolveOrigin(origin, geoPosition)
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

  // Cache local du meilleur itinéraire — reste consultable hors ligne. `steps`
  // ne retient que mode/distance/durée/ligne/noms de lieu de chaque segment,
  // jamais `from`/`to`/`shape` (coordonnées) — même principe que la règle
  // RGPD CLAUDE.md sur `trips` (pas de GPS précis stocké au-delà du calcul),
  // étendu ici par cohérence à ce cache client bien que la règle ne vise
  // formellement que la table serveur.
  useEffect(() => {
    if (journeys.length === 0 || !toLabel) return
    const best = journeys[0]
    const resolvedFromLabel = resolveOriginLabel(origin, geoPosition) ?? 'Votre position'
    const lastSegmentIdx = best.segments.length - 1
    void saveLastJourney({
      fromLabel: resolvedFromLabel,
      toLabel,
      durationMin: best.totalDurationMin,
      co2SavedGrams: best.co2SavingG,
      savedAt: new Date().toISOString(),
      steps: best.segments.map((segment, idx) => ({
        mode: segment.mode,
        distanceKm: segment.distanceKm,
        durationMin: segment.durationMin,
        lineName: segment.lineName,
        // Le provider ne connaît pas l'adresse saisie par l'utilisateur (ni
        // en début ni en fin d'itinéraire, seulement les arrêts/stations
        // intermédiaires) — le premier/dernier segment retombe donc sur le
        // fromLabel/toLabel déjà résolu par la recherche.
        fromName: segment.fromName ?? (idx === 0 ? resolvedFromLabel : undefined),
        toName: segment.toName ?? (idx === lastSegmentIdx ? toLabel : undefined),
      })),
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [journeys, toLabel])

  function handleGrant() {
    locatedOnMount.current = true
    setShowLocateConsent(false)
    grantGeolocation()
    // POST /api/auth/consent est authGuard'd — ne trace le consentement côté
    // serveur que pour un compte réel ; le consentement local (Zustand) suffit
    // à l'expérience invité et évite un 401 -> clearAuth() qui l'éjecterait.
    if (!isGuest) void recordGeolocationConsent()
    locate()
  }

  // Réponse à "Ma position" (barre de recherche) : redevenir prioritaire sur
  // toute adresse saisie manuellement (dispatchOrigin 'reset', même sémantique
  // que resetSearch côté départ) puis relocaliser — via la modale de
  // consentement si elle n'a pas déjà été accordée, jamais en l'activant à
  // son insu.
  function handleUseMyLocation() {
    dispatchOrigin({ type: 'reset' })
    if (geolocationConsent === 'granted') {
      locate()
    } else {
      setShowLocateConsent(true)
    }
  }

  // L'utilisateur accepte le suivi GPS continu — la machine à états du suivi
  // vit dans useTripTracking, seul le sheet reste piloté depuis MapPage.
  function handleStartTracking() {
    tracking.start()
    setSheetState('tracking')
  }

  // L'utilisateur refuse le suivi GPS — le trajet est enregistré à 0 point,
  // mais le sheet doit revenir à un état replié propre plutôt que de rester
  // bloqué sur le panneau détail avec "Partir maintenant" toujours affiché
  // (même resetSearch que handleSummaryClose, pour un trajet déjà terminé).
  function handleSkipTracking() {
    void tracking.skip()
    resetSearch()
  }

  // Inverse départ et arrivée. L'ancien départ (GPS ou adresse) devient une
  // arrivée fixe ; l'ancienne arrivée devient le nouveau départ, qui doit
  // rester prioritaire sur le GPS (dispatchOrigin 'set') sans quoi
  // userPosition reviendrait aussitôt à la position courante.
  function handleSwapDirection() {
    const prevFromCoords = userPosition
    const prevFromLabel = effectiveFromLabel
    const prevToCoords = toCoords
    const prevToLabel = toLabel

    dispatchOrigin({ type: 'set', coords: prevToCoords, label: prevToLabel })
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
    dispatchOrigin({ type: 'reset' })
    setToCoords(null)
    setToLabel(null)
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
      dispatchOrigin({ type: 'reset' })
      setToCoords(null)
      setToLabel(null)
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

  const effectiveFromLabel = resolveOriginLabel(origin, geoPosition)
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
          dispatchOrigin({ type: 'set', coords: c, label })
        }}
        onUseMyLocation={handleUseMyLocation}
        geoLoading={geoLoading}
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
        offline={!isOnline && tracking.trackingPhase !== 'active'}
        onRetry={recheckOnlineStatus}
      />

      <div className="h-screen lg:h-auto lg:flex-1 lg:min-w-0">
        <main
          className="h-full relative overflow-hidden isolate group"
          role="application"
          aria-label="Carte de mobilité de Nantes"
        >
          {/* Fond hachuré + bandeau (MAQUETTE.md §5.7 "Hors ligne") — propriété
           * de la zone carte, pas du sheet (qui affiche son propre contenu
           * hors ligne via `MapSheet`'s `offline` prop). Ne recouvre pas un
           * suivi de trajet déjà en cours — le GPS et le segment affiché ne
           * dépendent pas du réseau une fois le trajet chargé. `z-sheet` (pas
           * `z-modal`) : même niveau que les autres overlays flottants de
           * cette carte (météo, localisation, bannières d'erreur ci-dessous)
           * pour rester interlacé avec eux par ordre du DOM plutôt que de les
           * bloquer sous un empilement supérieur — seules les tuiles Leaflet
           * (z-index interne inférieur, cf. commentaire `.bottom-sheet` dans
           * index.css) doivent rester sous ce calque. */}
          {!isOnline && tracking.trackingPhase !== 'active' && (
            <div
              aria-hidden="true"
              className="absolute inset-0 z-sheet"
              style={{
                backgroundImage:
                  'repeating-linear-gradient(135deg, var(--color-surface-sunken) 0 12px, var(--color-surface-muted) 12px 24px)',
              }}
            />
          )}

          {/* Visible aussi en desktop (décision produit) : `<main>` est un
           * `flex-1` placé après `<MapSheet>` dans la ligne flex du parent —
           * `absolute left-3.5 right-3.5` reste donc cadré sur la largeur de
           * `<main>` (relative) et ne déborde jamais sur le sheet docké,
           * plutôt qu'un `fixed` pleine largeur qui le recouvrirait. Léger
           * doublon avec le "Pas de connexion" du panneau docké, jugé
           * acceptable pour garder le même repère "carte indisponible" qu'en
           * mobile plutôt que d'en priver le desktop. */}
          {!isOnline && tracking.trackingPhase !== 'active' && (
            <div className="absolute top-3.5 left-3.5 right-3.5 z-sheet flex items-center gap-2.5 h-11 px-3.5 rounded-md bg-warning-surface border-[1.5px] border-warning-border">
              <svg
                aria-hidden="true"
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.9"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-warning shrink-0"
              >
                <path d="M2 8.5a15 15 0 0 1 20 0M5.5 12a10 10 0 0 1 13 0M9 15.5a5 5 0 0 1 6 0M12 19h.01" />
                <path d="M4 4l16 16" />
              </svg>
              <span className="flex-1 text-body-sm font-semibold text-warning">
                Hors ligne — carte non disponible
              </span>
            </div>
          )}

          {weather && (
            <div className="absolute top-3 right-3 z-sheet">
              <WeatherBadge weather={weather} variant="map" />
            </div>
          )}

          {geoLoading && (
            <div
              role="status"
              aria-label="Localisation en cours"
              className="absolute top-3 left-1/2 -translate-x-1/2 z-sheet bg-surface rounded-full px-4 py-2 shadow-card flex items-center gap-2 text-body-sm text-text-muted whitespace-nowrap"
            >
              <div
                className="w-4 h-4 border-2 border-border border-t-eco-600 rounded-full animate-spin"
                aria-hidden="true"
              />
              Localisation en cours…
            </div>
          )}

          {showGeoError && geoError && (
            <div className="absolute top-3 left-3 right-3 z-sheet flex items-start gap-2">
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
            <div className="absolute top-3 right-3 z-sheet w-72">
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
              subdomains={CARTO_SUBDOMAINS}
              attribution={CARTO_ATTRIBUTION}
              className={
                isDarkMode ? 'saturate-[.5] brightness-[.92]' : 'saturate-[.55] contrast-[1.02]'
              }
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
        </main>
      </div>

      {/* Toast confirmation départ sans suivi — porté hors de <main> (z-index:auto)
          pour ne pas être recouvert par le bottom sheet (z-sheet), comme les
          autres modales de ce flow. */}
      {tracking.tripResult &&
        createPortal(
          <TripToast
            co2SavedGrams={tracking.tripResult.co2SavedGrams}
            pointsEarned={tracking.tripResult.pointsEarned}
            totalPoints={tracking.tripResult.totalPoints}
            newlyUnlockedBadges={tracking.tripResult.newlyUnlockedBadges}
            onClose={tracking.dismissTripToast}
          />,
          document.body
        )}

      {/* Modale consentement géolocalisation — automatique au premier passage
       * (`geolocationConsent === null`), ou rouverte à la demande depuis le
       * bouton "Ma position" (`showLocateConsent`) si l'utilisateur n'a pas
       * déjà accordé l'accès. */}
      {(geolocationConsent === null || showLocateConsent) &&
        createPortal(
          <GeolocationConsent
            onGrant={handleGrant}
            onDeny={() => {
              setShowLocateConsent(false)
              denyGeolocation()
            }}
          />,
          document.body
        )}

      {/* Modale consentement suivi continu */}
      {tracking.trackingPhase === 'consent' &&
        createPortal(
          <TrackingConsentModal onAccept={handleStartTracking} onSkip={handleSkipTracking} />,
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
