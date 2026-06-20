import { CO2_FACTORS } from '@shared/constants/co2-factors'
import type { Journey, JourneySegment, TransportMode, WeatherCondition } from '@shared/types/index'
import { WeatherBadge } from './WeatherBadge'

// ── Constantes ─────────────────────────────────────────────────────────────────

const MODE_COLORS: Record<TransportMode, string> = {
  walk: '#94a3b8',
  bike: '#4ade80',
  tramway: '#818cf8',
  bus: '#fcd34d',
  scooter: '#22d3ee',
  navibus: '#38bdf8',
  train: '#a78bfa',
}

const MODE_ICONS: Record<TransportMode, string> = {
  walk: '🚶',
  bike: '🚲',
  tramway: '🚋',
  bus: '🚌',
  scooter: '🛴',
  navibus: '⛴️',
  train: '🚆',
}

const MODE_LABELS: Record<TransportMode, string> = {
  walk: 'Marche',
  bike: 'Vélo',
  tramway: 'Tramway',
  bus: 'Bus',
  scooter: 'Trottinette',
  navibus: 'Navibus',
  train: 'Train',
}

const TC_MODES = new Set<TransportMode>(['bus', 'tramway', 'navibus', 'train'])

// Intervalles typiques entre passages (minutes) — estimation sans SIRI-Lite
const TC_HEADWAY: Partial<Record<TransportMode, number>> = {
  tramway: 7,
  bus: 12,
  navibus: 20,
  train: 30,
}

// Calories estimées par minute selon le mode
const CALORIES_PER_MIN: Partial<Record<TransportMode, number>> = {
  walk: 5,
  bike: 8,
  scooter: 1,
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatDuration(min: number): string {
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m > 0 ? `${h}h${m.toString().padStart(2, '0')}` : `${h}h`
}

function formatCo2(grams: number): string {
  return grams >= 1000 ? `${(grams / 1000).toFixed(1)} kg` : `${grams} g`
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

function avgSpeedKmh(distKm: number, durationMin: number): number {
  if (durationMin === 0 || distKm === 0) return 0
  return Math.round((distKm / (durationMin / 60)) * 10) / 10
}

function estimatedNextDepartures(mode: TransportMode, scheduled: string): string[] {
  const headway = TC_HEADWAY[mode] ?? 12
  const base = new Date(scheduled).getTime()
  return [1, 2].map((i) => new Date(base + i * headway * 60_000).toISOString())
}

// ── SegmentDetail ──────────────────────────────────────────────────────────────

function SegmentDetail({ segment }: { segment: JourneySegment }) {
  const isTc = TC_MODES.has(segment.mode)
  const speed = avgSpeedKmh(segment.distanceKm, segment.durationMin)
  const calories = CALORIES_PER_MIN[segment.mode]
    ? Math.round((CALORIES_PER_MIN[segment.mode] as number) * segment.durationMin)
    : undefined
  const nextDeps = segment.scheduledDeparture
    ? estimatedNextDepartures(segment.mode, segment.scheduledDeparture)
    : []

  const co2SavedG =
    segment.distanceKm > 0
      ? Math.max(0, Math.round(segment.distanceKm * CO2_FACTORS.car) - segment.co2g)
      : 0

  return (
    <div className="ml-11 mb-2 rounded-xl border border-border bg-bg-elevated p-3 space-y-3 animate-slide-up">
      {/* Prochains passages TC */}
      {isTc && segment.scheduledDeparture && (
        <div>
          <p className="text-caption font-semibold text-text-muted uppercase tracking-wide mb-1.5">
            Prochains passages
          </p>
          <div className="flex flex-wrap gap-1.5">
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-bg-card border border-border text-caption font-semibold text-text-primary">
              {formatTime(segment.scheduledDeparture)}
              <span className="text-accent-eco font-medium">prévu</span>
            </span>
            {nextDeps.map((dep, i) => (
              <span
                key={i}
                className="inline-flex items-center px-2 py-1 rounded-md bg-bg-card border border-border text-caption text-text-muted"
              >
                ~{formatTime(dep)}
              </span>
            ))}
            <span className="self-center text-[10px] text-text-disabled italic">estimés</span>
          </div>
        </div>
      )}

      {/* Stats du segment */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-bg-card rounded-lg p-2 text-center border border-border">
          <p className="text-[10px] text-text-muted leading-none mb-0.5">Durée</p>
          <p className="text-body-sm font-bold text-text-primary tabular-nums">
            {formatDuration(segment.durationMin)}
          </p>
        </div>

        <div className="bg-bg-card rounded-lg p-2 text-center border border-border">
          <p className="text-[10px] text-text-muted leading-none mb-0.5">Distance</p>
          <p className="text-body-sm font-bold text-text-primary tabular-nums">
            {segment.distanceKm} km
          </p>
        </div>

        {segment.co2g > 0 ? (
          <div className="bg-bg-card rounded-lg p-2 text-center border border-border">
            <p className="text-[10px] text-text-muted leading-none mb-0.5">CO₂</p>
            <p className="text-body-sm font-bold text-text-secondary tabular-nums">
              {formatCo2(segment.co2g)}
            </p>
          </div>
        ) : speed > 0 ? (
          <div className="bg-bg-card rounded-lg p-2 text-center border border-border">
            <p className="text-[10px] text-text-muted leading-none mb-0.5">Vitesse</p>
            <p className="text-body-sm font-bold text-text-primary tabular-nums">{speed} km/h</p>
          </div>
        ) : null}
      </div>

      {/* Ligne basse : calories + économie CO2 */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        {calories !== undefined && calories > 0 && (
          <span className="inline-flex items-center gap-1 text-caption text-text-muted">
            <svg
              aria-hidden="true"
              width="11"
              height="11"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
            ~{calories} kcal
          </span>
        )}
        {co2SavedG > 0 && (
          <span className="inline-flex items-center gap-1 text-caption text-accent-eco font-medium">
            <svg
              aria-hidden="true"
              width="11"
              height="11"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M17 8C8 10 5.9 16.17 3.82 22c2 0 7.68-1 13-6 2-2 3-5 3-8s-1-5-1-5l-1.82 5z" />
            </svg>
            -{formatCo2(co2SavedG)} CO₂ vs voiture
          </span>
        )}
      </div>
    </div>
  )
}

// ── JourneyPanel ──────────────────────────────────────────────────────────────

export type JourneyTrackingPhase = 'idle' | 'active'

interface JourneyPanelProps {
  journey: Journey
  onClose: () => void
  onDepartClick?: () => void
  onEndTrip?: () => void
  trackingPhase?: JourneyTrackingPhase
  weather?: WeatherCondition | null
  activeSegmentIdx: number | null
  onSegmentSelect: (idx: number | null) => void
}

export function JourneyPanel({
  journey,
  onClose,
  onDepartClick,
  onEndTrip,
  trackingPhase = 'idle',
  weather,
  activeSegmentIdx,
  onSegmentSelect,
}: JourneyPanelProps) {
  function toggleSegment(idx: number) {
    onSegmentSelect(activeSegmentIdx === idx ? null : idx)
  }

  return (
    <div
      className={[
        'absolute z-[1200] bg-bg-card overflow-y-auto',
        'bottom-0 left-0 right-0 max-h-[58vh] rounded-t-2xl',
        'shadow-[0_-8px_32px_rgba(0,0,0,0.20)]',
        'lg:top-0 lg:right-0 lg:bottom-0 lg:left-auto lg:w-80 lg:max-h-none lg:rounded-none',
        'lg:shadow-[-8px_0_32px_rgba(0,0,0,0.12)]',
      ].join(' ')}
      role="complementary"
      aria-label="Résumé de l'itinéraire"
    >
      {/* Poignée mobile */}
      <div className="flex justify-center pt-3 lg:hidden" aria-hidden="true">
        <div className="w-8 h-1 bg-border-strong rounded-full" />
      </div>

      <div className="p-4 lg:p-5">
        {/* Lien retour */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Retour aux options d'itinéraires"
          className="inline-flex items-center gap-1.5 text-body-sm font-medium text-accent-eco mb-4 hover:opacity-80 transition-opacity duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-eco focus-visible:rounded"
        >
          <svg
            aria-hidden="true"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          Retour aux options
        </button>

        {/* En-tête */}
        <div className="mb-4">
          <h2 className="text-h3 font-bold text-text-primary">{journey.label}</h2>
          <p className="text-caption text-text-muted mt-0.5">
            {journey.departureTime
              ? `Partir à ${formatTime(journey.departureTime)}`
              : 'Meilleur itinéraire'}
          </p>
          {weather && (
            <div className="mt-1.5">
              <WeatherBadge weather={weather} variant="panel" />
            </div>
          )}
        </div>

        {/* Métriques clés */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="bg-bg-elevated rounded-card p-3">
            <p className="text-caption text-text-muted mb-0.5">Durée totale</p>
            <p className="text-display font-bold text-text-primary leading-none mt-1">
              {formatDuration(journey.totalDurationMin)}
            </p>
          </div>
          <div className="bg-bg-elevated rounded-card p-3">
            <p className="text-caption text-text-muted mb-0.5">vs voiture</p>
            <p className="text-display font-bold text-accent-eco leading-none mt-1">
              -{formatCo2(journey.co2SavingG)} CO₂
            </p>
          </div>
        </div>

        {/* Segments */}
        <p className="text-caption font-semibold text-text-muted uppercase tracking-wide mb-3">
          Détail du trajet
          <span className="ml-1 normal-case font-normal text-text-disabled">
            · tap pour les détails
          </span>
        </p>

        <ol className="space-y-0">
          {journey.segments.map((segment, idx) => {
            const isActive = activeSegmentIdx === idx

            return (
              <li key={idx}>
                {/* Bloc d'attente */}
                {segment.waitTimeMin !== undefined && segment.waitTimeMin > 0 && (
                  <div
                    className="flex gap-3 items-center py-1 ml-0.5"
                    aria-label={`Attente ${formatDuration(segment.waitTimeMin)}`}
                  >
                    <div className="shrink-0 w-7 flex flex-col items-center">
                      <div
                        aria-hidden="true"
                        className="w-0.5 h-5 border-l-2 border-dashed border-border-strong"
                      />
                    </div>
                    <div className="flex items-center gap-2 bg-bg-elevated border border-border rounded-lg px-2.5 py-1.5 flex-1">
                      <svg
                        aria-hidden="true"
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-accent-warning shrink-0"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      <span className="text-caption text-accent-warning font-medium">
                        Attente : {formatDuration(segment.waitTimeMin)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Segment cliquable */}
                <button
                  type="button"
                  onClick={() => toggleSegment(idx)}
                  aria-expanded={isActive}
                  aria-label={`${isActive ? 'Masquer' : 'Voir'} les détails : ${segment.lineName ?? MODE_LABELS[segment.mode]}`}
                  className={[
                    'flex gap-3 relative w-full text-left rounded-lg transition-colors duration-150 cursor-pointer',
                    isActive ? 'bg-bg-elevated' : 'hover:bg-bg-elevated/50',
                  ].join(' ')}
                  style={
                    isActive
                      ? {
                          borderLeft: `3px solid ${MODE_COLORS[segment.mode]}`,
                          paddingLeft: '0.375rem',
                        }
                      : {}
                  }
                >
                  {/* Ligne verticale entre segments */}
                  {idx < journey.segments.length - 1 && (
                    <div
                      aria-hidden="true"
                      className="absolute top-9 bottom-0 w-0.5 opacity-25 transition-opacity duration-150"
                      style={{
                        left: isActive ? '1.125rem' : '0.875rem',
                        background: MODE_COLORS[segment.mode],
                      }}
                    />
                  )}

                  {/* Icône mode */}
                  <div
                    aria-hidden="true"
                    className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm z-10 mt-0.5 transition-transform duration-150"
                    style={{
                      background: MODE_COLORS[segment.mode] + (isActive ? '30' : '20'),
                      border: `2px solid ${MODE_COLORS[segment.mode]}`,
                      transform: isActive ? 'scale(1.1)' : 'scale(1)',
                    }}
                  >
                    {MODE_ICONS[segment.mode]}
                  </div>

                  {/* Contenu */}
                  <div className="pb-3 pt-0.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-body-sm font-medium text-text-primary leading-snug truncate">
                        {segment.lineName ?? MODE_LABELS[segment.mode]}
                      </p>
                      {segment.scheduledDeparture && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-caption font-medium bg-bg-elevated text-text-muted shrink-0">
                          <svg
                            aria-hidden="true"
                            width="10"
                            height="10"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                          </svg>
                          {formatTime(segment.scheduledDeparture)}
                        </span>
                      )}
                    </div>
                    <p className="text-caption text-text-muted mt-0.5">
                      {formatDuration(segment.durationMin)}
                      {segment.waitTimeMin !== undefined && ' en véhicule'}
                      {segment.distanceKm > 0 && ` · ${segment.distanceKm} km`}
                      {segment.co2g > 0 && ` · ${segment.co2g} g CO₂`}
                    </p>
                  </div>

                  {/* Chevron */}
                  <div className="shrink-0 flex items-center pr-1 pt-1">
                    <svg
                      aria-hidden="true"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-text-muted transition-transform duration-200"
                      style={{ transform: isActive ? 'rotate(180deg)' : 'rotate(0deg)' }}
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </div>
                </button>

                {/* Panneau de détail expandable */}
                {isActive && <SegmentDetail segment={segment} />}
              </li>
            )
          })}
        </ol>

        {/* Empreinte totale */}
        {journey.totalCo2g > 0 && (
          <div className="pt-3 border-t border-border">
            <p className="text-caption text-text-muted">
              Empreinte totale :{' '}
              <span className="font-medium text-text-secondary">{formatCo2(journey.totalCo2g)} CO₂</span>
            </p>
          </div>
        )}

        {/* CTA — Partir / Terminer */}
        {trackingPhase === 'active' ? (
          <div className="mt-4 pt-4 border-t border-border space-y-3">
            {/* Indicateur suivi actif */}
            <div className="flex items-center gap-2 px-3 py-2 bg-bg-elevated rounded-lg border border-border">
              <span
                aria-hidden="true"
                className="shrink-0 w-2 h-2 rounded-full bg-accent-transit animate-pulse"
              />
              <p className="text-caption font-medium text-accent-transit">Suivi GPS actif</p>
            </div>
            <button
              type="button"
              onClick={onEndTrip}
              className="btn-secondary w-full justify-center"
            >
              <svg
                aria-hidden="true"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" />
              </svg>
              Terminer le trajet
            </button>
          </div>
        ) : (
          onDepartClick && (
            <div className="mt-4 pt-4 border-t border-border">
              <button
                type="button"
                onClick={onDepartClick}
                className="btn-primary w-full justify-center"
              >
                <svg
                  aria-hidden="true"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
                Partir maintenant
              </button>
            </div>
          )
        )}
      </div>
    </div>
  )
}
