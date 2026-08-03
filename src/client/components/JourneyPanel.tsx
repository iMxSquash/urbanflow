import { CO2_FACTORS } from '@shared/constants/co2-factors'
import type { Journey, JourneySegment, TransportMode, WeatherCondition } from '@shared/types/index'
import { MODE_ICON_PATH_BASE } from '../constants/mode-icons'
import { WeatherBadge } from './WeatherBadge'

// ── Constantes ─────────────────────────────────────────────────────────────────

// Couleurs par mode — alignées sur les tokens --color-mode-* (DESIGN-SYSTEM.md §1.1),
// pas les teintes par défaut Tailwind : identiques dans les deux thèmes puisque
// posées ici en valeurs fixes plutôt qu'en variables (le halo de segment sur la
// carte utilise déjà ces mêmes teintes, cf. trace-segment).
const MODE_COLORS: Record<TransportMode, string> = {
  walk: '#5B6B63',
  bike: '#0B5C43',
  tramway: '#1D5E7A',
  bus: '#6B3F8F',
  scooter: '#5C6E1A',
  navibus: '#0F6B6B',
  train: '#33449E',
}

// Un seul jeu d'icônes SVG (MAQUETTE.md §1.7) — jamais d'emoji fonctionnel.
// scooter/train ajoutés localement : `ModeChip` ne les porte pas (chips
// texte seul dans la maquette), mais un segment de trajet doit toujours
// avoir une icône, tous modes confondus.
const MODE_ICONS: Record<TransportMode, React.ReactNode> = {
  ...MODE_ICON_PATH_BASE,
  scooter: (
    <>
      <circle cx="5" cy="19" r="2" />
      <circle cx="17" cy="19" r="2" />
      <path d="M5 19h7l1.5-10h5.5M12 12h3" />
    </>
  ),
  train: (
    <>
      <rect x="5" y="4" width="14" height="13" rx="3" />
      <path d="M9 4V2M15 4V2M5 10h14M8 21l-1.5-4M16 21l1.5-4M4 21h16" />
      <circle cx="9" cy="13.5" r="1" />
      <circle cx="15" cy="13.5" r="1" />
    </>
  ),
} as Record<TransportMode, React.ReactNode>

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

  // CO2 économisé vs voiture pour ce segment
  const co2SavedG =
    segment.distanceKm > 0
      ? Math.max(0, Math.round(segment.distanceKm * CO2_FACTORS.car) - segment.co2g)
      : 0

  return (
    <div
      className="ml-11 mb-2 rounded-xl border border-border bg-surface-sunken p-3 space-y-3"
      style={{ animation: 'var(--animate-slide-up)' }}
    >
      {/* Prochains passages TC */}
      {isTc && segment.scheduledDeparture && (
        <div>
          <p className="text-caption font-semibold text-text-subtle uppercase tracking-wide mb-1.5">
            Prochains passages
          </p>
          <div className="flex flex-wrap gap-1.5">
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-surface border border-eco-200 text-caption font-semibold text-text">
              {formatTime(segment.scheduledDeparture)}
              <span className="text-eco-600 font-medium">prévu</span>
            </span>
            {nextDeps.map((dep, i) => (
              <span
                key={i}
                className="inline-flex items-center px-2 py-1 rounded-md bg-surface border border-border text-caption text-text-subtle"
              >
                ~{formatTime(dep)}
              </span>
            ))}
            <span className="self-center text-[10px] text-text-subtle italic">estimés</span>
          </div>
        </div>
      )}

      {/* Stats du segment */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-surface rounded-lg p-2 text-center border border-border">
          <p className="text-[10px] text-text-subtle leading-none mb-0.5">Durée</p>
          <p className="text-body-sm font-bold text-text tabular-nums">
            {formatDuration(segment.durationMin)}
          </p>
        </div>

        <div className="bg-surface rounded-lg p-2 text-center border border-border">
          <p className="text-[10px] text-text-subtle leading-none mb-0.5">Distance</p>
          <p className="text-body-sm font-bold text-text tabular-nums">
            {segment.distanceKm} km
          </p>
        </div>

        {segment.co2g > 0 ? (
          <div className="bg-surface rounded-lg p-2 text-center border border-border">
            <p className="text-[10px] text-text-subtle leading-none mb-0.5">CO₂</p>
            <p className="text-body-sm font-bold text-text-muted tabular-nums">
              {formatCo2(segment.co2g)}
            </p>
          </div>
        ) : speed > 0 ? (
          <div className="bg-surface rounded-lg p-2 text-center border border-border">
            <p className="text-[10px] text-text-subtle leading-none mb-0.5">Vitesse</p>
            <p className="text-body-sm font-bold text-text tabular-nums">{speed} km/h</p>
          </div>
        ) : null}
      </div>

      {/* Ligne basse : calories + économie CO2 */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        {calories !== undefined && calories > 0 && (
          <span className="inline-flex items-center gap-1 text-caption text-text-subtle">
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
          <span className="inline-flex items-center gap-1 text-caption text-eco-700 font-medium">
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

  // Contenu pur — le conteneur (.bottom-sheet, poignée, role="dialog") est fourni
  // par MapSheet, qui compose ce composant pour les états "detail" et "tracking".
  return (
    <div>
      {/* En-tête */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="text-h3 font-bold text-text">{journey.label}</h2>
          <p className="text-caption text-text-subtle mt-0.5">
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
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer le panneau itinéraire"
          className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full text-text-subtle hover:text-text-muted hover:bg-surface-sunken transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eco-600"
        >
          <svg
            aria-hidden="true"
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M1 1l12 12M13 1L1 13" />
          </svg>
        </button>
      </div>

      {/* Métriques clés */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-surface-sunken rounded-card p-3">
          <p className="text-caption text-text-subtle mb-0.5">Durée totale</p>
          <p className="text-display font-bold text-text leading-none mt-1">
            {formatDuration(journey.totalDurationMin)}
          </p>
        </div>
        <div className="bg-eco-50 rounded-card p-3">
          <p className="text-caption text-text-subtle mb-0.5">vs voiture</p>
          <p className="text-display font-bold text-eco-700 leading-none mt-1">
            -{formatCo2(journey.co2SavingG)} CO₂
          </p>
        </div>
      </div>

      {/* Segments */}
      <p className="text-caption font-semibold text-text-subtle uppercase tracking-wide mb-3">
        Détail du trajet
        <span className="ml-1 normal-case font-normal text-text-disabled">· tap pour les détails</span>
      </p>

      <ol className="space-y-0">
        {journey.segments.map((segment, idx) => {
          const isActive = activeSegmentIdx === idx

          return (
            <li key={idx}>
              {/* Bloc d'attente — affiché uniquement si waitTimeMin > 0 */}
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
                  <div className="flex items-center gap-2 bg-warning-surface-soft border border-warning-border rounded-lg px-2.5 py-1.5 flex-1">
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
                      className="text-warning shrink-0"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    <span className="text-caption text-warning font-medium">
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
                  isActive ? 'bg-surface-sunken' : 'hover:bg-surface-sunken/70',
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
                  className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center z-10 mt-0.5 transition-transform duration-150"
                  style={{
                    background: MODE_COLORS[segment.mode] + (isActive ? '30' : '20'),
                    border: `2px solid ${MODE_COLORS[segment.mode]}`,
                    color: MODE_COLORS[segment.mode],
                    transform: isActive ? 'scale(1.1)' : 'scale(1)',
                  }}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.9"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    {MODE_ICONS[segment.mode]}
                  </svg>
                </div>

                {/* Contenu */}
                <div className="pb-3 pt-0.5 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-body-sm font-medium text-text leading-snug truncate">
                      {segment.lineName ?? MODE_LABELS[segment.mode]}
                    </p>
                    {segment.scheduledDeparture && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-caption font-medium bg-surface-sunken text-text-muted shrink-0">
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
                  <p className="text-caption text-text-subtle mt-0.5">
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
                    className="text-text-subtle transition-transform duration-200"
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
          <p className="text-caption text-text-subtle">
            Empreinte totale :{' '}
            <span className="font-medium text-text-muted">{formatCo2(journey.totalCo2g)} CO₂</span>
          </p>
        </div>
      )}

      {/* CTA — Partir / Terminer */}
      {trackingPhase === 'active' ? (
        <div className="mt-4 pt-4 border-t border-border space-y-3">
          {/* Indicateur suivi actif */}
          <div className="flex items-center gap-2 px-3 py-2 bg-transit-50 rounded-lg border border-transit-100">
            {/* Marqueur statique — jamais de pulsation en boucle continue (règle Estuaire) */}
            <span aria-hidden="true" className="shrink-0 w-2 h-2 rounded-full bg-transit-500" />
            <p className="text-caption font-medium text-transit-700">Suivi GPS actif</p>
          </div>
          <button
            type="button"
            onClick={onEndTrip}
            className="btn-secondary w-full justify-center border-border-strong"
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
  )
}
