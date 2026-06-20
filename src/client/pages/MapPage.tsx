import 'leaflet/dist/leaflet.css'
import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { MapContainer, TileLayer } from 'react-leaflet'
import { NavLink, useLocation } from 'react-router-dom'
import { AddressSearch } from '../components/AddressSearch'
import { DatetimePicker } from '../components/DatetimePicker'
import { ErrorBanner } from '../components/ErrorBanner'
import { GeolocationConsent } from '../components/GeolocationConsent'
import { EcoMapLayer } from '../components/EcoMapLayer'
import { JourneyLayer } from '../components/JourneyLayer'
import { JourneyPanel } from '../components/JourneyPanel'
import { JourneyResults } from '../components/JourneyResults'
import { JourneySummaryModal } from '../components/JourneySummaryModal'
import { MapLayerToggle } from '../components/MapLayerToggle'
import { TrackingConsentModal } from '../components/TrackingConsentModal'
import { TripToast } from '../components/TripToast'
import { UserLocationMarker } from '../components/UserLocationMarker'
import { WeatherBadge } from '../components/WeatherBadge'
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
import { useThemeStore } from '../stores/theme.store'
import type { Coordinates } from '@shared/types/index'

const BiclooLayer = lazy(() => import('../components/BiclooLayer'))
const TanLinesLayer = lazy(() => import('../components/TanLinesLayer'))
const TanStopsLayer = lazy(() => import('../components/TanStopsLayer'))

const NANTES_COMMERCE: [number, number] = [47.218, -1.553]
const NANTES_FALLBACK_COORDS = { lat: 47.218, lng: -1.553 }
const CARTO_POSITRON = 'https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
const CARTO_DARK_MATTER = 'https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
const CARTO_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors ' +
  '&copy; <a href="https://carto.com/attributions">CARTO</a>'

// ── Bottom navigation ──────────────────────────────────────────────────────
const NAV_ITEMS = [
  {
    label: 'Carte',
    to: '/',
    end: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" aria-hidden="true">
        <path d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
      </svg>
    ),
  },
  {
    label: 'Trajets',
    to: '/dashboard',
    end: false,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" aria-hidden="true">
        <circle cx="5" cy="18" r="2" />
        <circle cx="19" cy="6" r="2" />
        <path d="M5 16V10a4 4 0 014-4h6" />
        <path d="M16 4l3 2-3 2" />
      </svg>
    ),
  },
  {
    label: 'Stats',
    to: '/rewards',
    end: false,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" aria-hidden="true">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
  {
    label: 'Profil',
    to: '/profile',
    end: false,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" aria-hidden="true">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
] as const

// ── Types ──────────────────────────────────────────────────────────────────
type TrackingPhase = 'idle' | 'consent' | 'active' | 'done'

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

function useIsDark(): boolean {
  const themeMode = useThemeStore((s) => s.themeMode)
  if (themeMode === 'dark') return true
  if (themeMode === 'light') return false
  const h = new Date().getHours()
  return h >= 20 || h < 7
}

// ── Component ──────────────────────────────────────────────────────────────
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
  const [datetime, setDatetime] = useState<Date>(() => new Date())
  const [datetimeType, setDatetimeType] = useState<'departure' | 'arrival'>('departure')

  const [trackingPhase, setTrackingPhase] = useState<TrackingPhase>('idle')
  const [activeTracking, setActiveTracking] = useState<ActiveTrackingState | null>(null)
  const [summaryResult, setSummaryResult] = useState<RecordTripResult | null>(null)
  const [summaryDurationMin, setSummaryDurationMin] = useState(0)
  const arrivalHandledRef = useRef(false)

  const location = useLocation()
  const locatedOnMount = useRef(false)
  const scenarioApplied = useRef(false)
  const isDark = useIsDark()

  const trackingDestination = activeTracking?.destination ?? NANTES_FALLBACK_COORDS
  const { position: trackingPosition, arrived, stop: stopTracking } = useActiveTracking({
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
        : undefined,
      datetime,
      datetimeType
    )
  }, [location.state, calculate, profile, datetime, datetimeType])

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
        : undefined,
      datetime,
      datetimeType
    )
  }

  function handleDepartClick() {
    setTrackingPhase('consent')
  }

  function handleStartTracking() {
    if (!selectedJourney) return
    const destination = selectedJourney.segments.at(-1)!.to
    arrivalHandledRef.current = false
    setActiveTracking({ startTime: Date.now(), destination })
    setTrackingPhase('active')
  }

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
      // Le toast ne s'affiche pas en cas d'erreur réseau
    }
  }

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
      // Échec silencieux
    }
    setTrackingPhase('done')
    setActiveTracking(null)
  }

  function handleEndTrip() {
    void handleArrival()
  }

  function handleSummaryClose() {
    setSummaryResult(null)
    setActiveSegmentIdx(null)
    deselectJourney()
  }

  function handlePanelClose() {
    if (trackingPhase === 'active') {
      stopTracking()
      setActiveTracking(null)
    }
    setTrackingPhase('idle')
    setActiveSegmentIdx(null)
    deselectJourney()
  }

  const userPosition = geoPosition ?? addressPosition
  const displayPosition =
    trackingPhase === 'active' ? (trackingPosition ?? userPosition) : userPosition

  const showAddressSearch = geolocationConsent === 'denied' && !geoPosition
  const showGeoError = !!geoError && !geoLoading && geolocationConsent !== 'denied'
  const showDestSearch =
    !!userPosition && journeys.length === 0 && !selectedJourney && !journeyLoading
  const showBottomArea = journeys.length === 0 && !selectedJourney

  return (
    <div className="flex flex-col h-screen bg-bg-deep">
      {/* ── Map ── */}
      <main
        className="flex-1 relative overflow-hidden isolate"
        role="application"
        aria-label="Carte de mobilité de Nantes"
      >
        <MapContainer
          center={NANTES_COMMERCE}
          zoom={13}
          className="h-full w-full"
          zoomControl={false}
          attributionControl={false}
        >
          <TileLayer url={isDark ? CARTO_DARK_MATTER : CARTO_POSITRON} attribution={CARTO_ATTRIBUTION} />
          {layers.tanLines && (
            <Suspense fallback={null}><TanLinesLayer /></Suspense>
          )}
          {layers.tanStops && (
            <Suspense fallback={null}><TanStopsLayer /></Suspense>
          )}
          {layers.bikesharing && (
            <Suspense fallback={null}><BiclooLayer /></Suspense>
          )}
          {displayPosition && (
            <UserLocationMarker position={displayPosition} isTracking={trackingPhase === 'active'} />
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

        {/* ── Weather badge — top right ── */}
        {weather && (
          <div className="absolute top-4 right-4 z-[1100]">
            <WeatherBadge weather={weather} variant="map" />
          </div>
        )}

        {/* ── Loading: journey calc ── */}
        {journeyLoading && (
          <div
            role="status"
            aria-label="Calcul de l'itinéraire en cours"
            className="absolute top-4 left-1/2 -translate-x-1/2 z-[1100] bg-bg-card rounded-full px-4 py-2 shadow-card flex items-center gap-2 text-body-sm text-text-secondary whitespace-nowrap"
          >
            <div
              className="w-4 h-4 border-2 border-border border-t-accent-eco rounded-full animate-spin"
              aria-hidden="true"
            />
            Calcul de l'itinéraire…
          </div>
        )}

        {/* ── Loading: geolocation ── */}
        {geoLoading && (
          <div
            role="status"
            aria-label="Localisation en cours"
            className="absolute top-4 left-1/2 -translate-x-1/2 z-[1100] bg-bg-card rounded-full px-4 py-2 shadow-card flex items-center gap-2 text-body-sm text-text-secondary whitespace-nowrap"
          >
            <div
              className="w-4 h-4 border-2 border-border border-t-accent-eco rounded-full animate-spin"
              aria-hidden="true"
            />
            Localisation en cours…
          </div>
        )}

        {/* ── Journey error ── */}
        {journeyError && !journeyLoading && (
          <div className="absolute top-4 left-4 right-4 z-[1100]">
            <ErrorBanner message={journeyError} onClose={clearJourney} />
          </div>
        )}

        {/* ── Geo error ── */}
        {showGeoError && geoError && (
          <div className="absolute top-4 left-4 right-4 z-[1100] flex items-start gap-2">
            <div className="flex-1">
              <ErrorBanner message={geoError} onRetry={locate} />
            </div>
            <button
              type="button"
              onClick={denyGeolocation}
              className="btn-secondary text-caption px-3 shrink-0"
              style={{ minHeight: '44px' }}
            >
              Saisir une adresse
            </button>
          </div>
        )}

        {/* ── Weather error ── */}
        {weatherError && !weatherLoading && !weather && (
          <div className="absolute top-4 right-4 z-[1100] w-72">
            <ErrorBanner message="Météo indisponible" />
          </div>
        )}

        {/* ── Journey results bottom sheet ── */}
        {journeys.length > 0 && !selectedJourney && (
          <div
            className={[
              'absolute z-[1200] bg-bg-card overflow-y-auto',
              'bottom-0 left-0 right-0 max-h-[62vh] rounded-t-2xl shadow-float',
              'lg:top-0 lg:right-0 lg:bottom-0 lg:left-auto lg:w-80 lg:max-h-none lg:rounded-none',
              'lg:shadow-[-8px_0_32px_rgba(0,0,0,0.12)]',
            ].join(' ')}
            role="complementary"
            aria-label="Résultats des itinéraires"
          >
            <div className="flex justify-center pt-3 lg:hidden" aria-hidden="true">
              <div className="w-10 h-1 bg-border-strong rounded-full" />
            </div>
            <div className="p-4 lg:p-5">
              <JourneyResults journeys={journeys} onSelect={selectJourney} onClose={clearJourney} />
            </div>
          </div>
        )}

        {/* ── Journey detail panel ── */}
        {selectedJourney && (
          <JourneyPanel
            journey={selectedJourney}
            onClose={handlePanelClose}
            onDepartClick={handleDepartClick}
            onEndTrip={handleEndTrip}
            trackingPhase={trackingPhase === 'active' ? 'active' : 'idle'}
            weather={weather}
            activeSegmentIdx={activeSegmentIdx}
            onSegmentSelect={setActiveSegmentIdx}
          />
        )}

        {/* ── Bottom search / idle pill ── */}
        {showBottomArea && (
          <div className="absolute bottom-0 left-0 right-0 z-[1100] px-4 pb-4 flex flex-col gap-2">
            {showAddressSearch && (
              <AddressSearch onSelect={setAddressPosition} />
            )}
            {userPosition && !showAddressSearch && (
              <div className="bg-bg-card rounded-[14px] px-4 py-[14px] flex items-center gap-3 shadow-float">
                <span className="w-2.5 h-2.5 rounded-full bg-accent-eco shrink-0" aria-hidden="true" />
                <span className="text-body text-text-primary">Ma position actuelle</span>
              </div>
            )}
            {showDestSearch && (
              <>
                <AddressSearch onSelect={handleDestinationSelect} placeholder="Où allez-vous ?" />
                <DatetimePicker
                  datetime={datetime}
                  type={datetimeType}
                  onDatetimeChange={(dt) => {
                    setDatetime(dt)
                    clearJourney()
                  }}
                  onTypeChange={(t) => {
                    setDatetimeType(t)
                    clearJourney()
                  }}
                />
              </>
            )}
          </div>
        )}

        {/* ── Trip toast ── */}
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

      {/* ── Bottom Navigation ── */}
      <nav
        className="shrink-0 bg-bg-elevated border-t border-border z-navbar"
        aria-label="Navigation principale"
      >
        <ul className="flex h-[4.5rem]">
          {NAV_ITEMS.map(({ label, to, end, icon }) => (
            <li key={to} className="flex-1">
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                  [
                    'h-full flex flex-col items-center justify-center gap-1 px-2',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent-eco',
                    isActive ? 'text-accent-eco' : 'text-text-disabled',
                  ].join(' ')
                }
              >
                {({ isActive }) => (
                  <>
                    {icon}
                    <span
                      className={`text-[10px] font-medium leading-none transition-colors duration-fast ${
                        isActive ? 'text-text-primary' : 'text-text-disabled'
                      }`}
                    >
                      {label}
                    </span>
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* ── Portals ── */}
      {geolocationConsent === null &&
        createPortal(
          <GeolocationConsent onGrant={handleGrant} onDeny={denyGeolocation} />,
          document.body
        )}
      {trackingPhase === 'consent' &&
        createPortal(
          <TrackingConsentModal
            onAccept={handleStartTracking}
            onSkip={() => void handleSkipTracking()}
          />,
          document.body
        )}
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
