import { useState } from 'react'
import { CO2_FACTORS } from '@shared/constants/co2-factors'
import type { Journey, JourneySegment, TransportMode, WeatherCondition } from '@shared/types/index'
import { WeatherBadge } from './WeatherBadge'

// ── Constantes ─────────────────────────────────────────────────────────────────

const MODE_COLORS: Record<TransportMode, string> = {
  walk: '#94a3b8',
  bike: '#16a34a',
  tramway: '#6366f1',
  bus: '#f59e0b',
  scooter: '#0891b2',
  navibus: '#0ea5e9',
  train: '#7c3aed',
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

  // CO2 économisé vs voiture pour ce segment
  const co2SavedG =
    segment.distanceKm > 0
      ? Math.max(0, Math.round(segment.distanceKm * CO2_FACTORS.car) - segment.co2g)
      : 0

  return (
    <div
      className="ml-11 mb-2 rounded-xl border border-slate-100 bg-slate-50 p-3 space-y-3"
      style={{ animation: 'var(--animate-slide-up)' }}
    >
      {/* Prochains passages TC */}
      {isTc && segment.scheduledDeparture && (
        <div>
          <p className="text-caption font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
            Prochains passages
          </p>
          <div className="flex flex-wrap gap-1.5">
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white border border-eco-200 text-caption font-semibold text-slate-800">
              {formatTime(segment.scheduledDeparture)}
              <span className="text-eco-600 font-medium">prévu</span>
            </span>
            {nextDeps.map((dep, i) => (
              <span
                key={i}
                className="inline-flex items-center px-2 py-1 rounded-md bg-white border border-slate-200 text-caption text-slate-500"
              >
                ~{formatTime(dep)}
              </span>
            ))}
            <span className="self-center text-[10px] text-slate-400 italic">estimés</span>
          </div>
        </div>
      )}

      {/* Stats du segment */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white rounded-lg p-2 text-center border border-slate-100">
          <p className="text-[10px] text-slate-400 leading-none mb-0.5">Durée</p>
          <p className="text-body-sm font-bold text-slate-800 tabular-nums">
            {formatDuration(segment.durationMin)}
          </p>
        </div>

        <div className="bg-white rounded-lg p-2 text-center border border-slate-100">
          <p className="text-[10px] text-slate-400 leading-none mb-0.5">Distance</p>
          <p className="text-body-sm font-bold text-slate-800 tabular-nums">
            {segment.distanceKm} km
          </p>
        </div>

        {segment.co2g > 0 ? (
          <div className="bg-white rounded-lg p-2 text-center border border-slate-100">
            <p className="text-[10px] text-slate-400 leading-none mb-0.5">CO₂</p>
            <p className="text-body-sm font-bold text-slate-700 tabular-nums">
              {formatCo2(segment.co2g)}
            </p>
          </div>
        ) : speed > 0 ? (
          <div className="bg-white rounded-lg p-2 text-center border border-slate-100">
            <p className="text-[10px] text-slate-400 leading-none mb-0.5">Vitesse</p>
            <p className="text-body-sm font-bold text-slate-800 tabular-nums">{speed} km/h</p>
          </div>
        ) : null}
      </div>

      {/* Ligne basse : calories + économie CO2 */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        {calories !== undefined && calories > 0 && (
          <span className="inline-flex items-center gap-1 text-caption text-slate-500">
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

type DepartState = 'idle' | 'loading' | 'done' | 'error'

interface JourneyPanelProps {
  journey: Journey
  onClose: () => void
  onDepart?: () => Promise<void>
  weather?: WeatherCondition | null
  activeSegmentIdx: number | null
  onSegmentSelect: (idx: number | null) => void
}

export function JourneyPanel({
  journey,
  onClose,
  onDepart,
  weather,
  activeSegmentIdx,
  onSegmentSelect,
}: JourneyPanelProps) {
  const [departState, setDepartState] = useState<DepartState>('idle')

  function toggleSegment(idx: number) {
    onSegmentSelect(activeSegmentIdx === idx ? null : idx)
  }

  async function handleDepart() {
    if (!onDepart || departState === 'loading') return
    setDepartState('loading')
    try {
      await onDepart()
      setDepartState('done')
    } catch {
      setDepartState('error')
    }
  }

  return (
    <div
      className={[
        'absolute z-1100 bg-white overflow-y-auto',
        'bottom-0 left-0 right-0 max-h-[58vh] rounded-t-2xl',
        'shadow-[0_-8px_32px_rgba(0,0,0,0.12)]',
        'lg:top-0 lg:right-0 lg:bottom-0 lg:left-auto lg:w-80 lg:max-h-none lg:rounded-none',
        'lg:shadow-[-8px_0_32px_rgba(0,0,0,0.08)]',
      ].join(' ')}
      role="complementary"
      aria-label="Résumé de l'itinéraire"
    >
      {/* Poignée mobile */}
      <div className="flex justify-center pt-3 lg:hidden" aria-hidden="true">
        <div className="w-8 h-1 bg-slate-200 rounded-full" />
      </div>

      <div className="p-4 lg:p-5">
        {/* En-tête */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h2 className="text-h3 font-bold text-slate-900">{journey.label}</h2>
            <p className="text-caption text-slate-400 mt-0.5">
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
            className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eco-600"
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
          <div className="bg-slate-50 rounded-card p-3">
            <p className="text-caption text-slate-500 mb-0.5">Durée totale</p>
            <p className="text-display font-bold text-slate-900 leading-none mt-1">
              {formatDuration(journey.totalDurationMin)}
            </p>
          </div>
          <div className="bg-eco-50 rounded-card p-3">
            <p className="text-caption text-slate-500 mb-0.5">vs voiture</p>
            <p className="text-display font-bold text-eco-700 leading-none mt-1">
              -{formatCo2(journey.co2SavingG)} CO₂
            </p>
          </div>
        </div>

        {/* Segments */}
        <p className="text-caption font-semibold text-slate-400 uppercase tracking-wide mb-3">
          Détail du trajet
          <span className="ml-1 normal-case font-normal text-slate-300">
            · tap pour les détails
          </span>
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
                        className="w-0.5 h-5 border-l-2 border-dashed border-slate-300"
                      />
                    </div>
                    <div className="flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-1.5 flex-1">
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
                        className="text-amber-500 shrink-0"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      <span className="text-caption text-amber-700 font-medium">
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
                    isActive ? 'bg-slate-50' : 'hover:bg-slate-50/70',
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
                      <p className="text-body-sm font-medium text-slate-800 leading-snug truncate">
                        {segment.lineName ?? MODE_LABELS[segment.mode]}
                      </p>
                      {segment.scheduledDeparture && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-caption font-medium bg-slate-100 text-slate-600 shrink-0">
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
                    <p className="text-caption text-slate-400 mt-0.5">
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
                      className="text-slate-400 transition-transform duration-200"
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
          <div className="pt-3 border-t border-slate-100">
            <p className="text-caption text-slate-400">
              Empreinte totale :{' '}
              <span className="font-medium text-slate-600">{formatCo2(journey.totalCo2g)} CO₂</span>
            </p>
          </div>
        )}

        {/* CTA Partir maintenant */}
        {onDepart && departState !== 'done' && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => void handleDepart()}
              disabled={departState === 'loading'}
              aria-busy={departState === 'loading'}
              className="btn-primary w-full justify-center disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {departState === 'loading' ? (
                <>
                  <div
                    aria-hidden="true"
                    className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"
                  />
                  Enregistrement…
                </>
              ) : (
                <>
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
                  {departState === 'error' ? 'Réessayer' : 'Partir maintenant'}
                </>
              )}
            </button>
            {departState === 'error' && (
              <p role="alert" className="text-caption text-red-600 text-center mt-2">
                Impossible d'enregistrer le trajet. Vérifiez votre connexion.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
