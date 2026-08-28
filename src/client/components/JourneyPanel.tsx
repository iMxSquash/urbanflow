import type { Journey, WeatherCondition } from '@shared/types/index'
import {
  MODE_ICON_PATH_BASE,
  MODE_LABELS,
  modeColorVar,
  modeColorVarAlpha,
} from '../constants/mode-icons'
import { formatCo2, formatDuration, formatTime } from '../utils/format-journey'
import { WeatherBadge } from './WeatherBadge'
import { SegmentDetail } from './SegmentDetail'

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
        <span className="ml-1 normal-case font-normal text-text-disabled">
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

              {/* Segment cliquable + panneau de détail, ancrage commun pour la ligne verticale */}
              <div className="relative">
                {idx < journey.segments.length - 1 && (
                  <div
                    aria-hidden="true"
                    className="absolute top-11 bottom-0 w-0.5 opacity-25"
                    style={{
                      left: '0.875rem',
                      background: modeColorVar(segment.mode),
                    }}
                  />
                )}

                <button
                  type="button"
                  onClick={() => toggleSegment(idx)}
                  aria-expanded={isActive}
                  aria-controls={`segment-detail-${idx}`}
                  aria-label={`${isActive ? 'Masquer' : 'Voir'} les détails : ${segment.lineName ?? MODE_LABELS[segment.mode]}`}
                  className={[
                    'relative flex gap-3 w-full text-left rounded-lg transition-colors duration-fast ease-ui cursor-pointer',
                    isActive ? 'bg-surface-sunken' : 'hover:bg-surface-sunken/70',
                  ].join(' ')}
                >
                  {/* Icône mode */}
                  <div
                    aria-hidden="true"
                    className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center z-10 mt-0.5 transition-all duration-fast ease-ui"
                    style={{
                      background: modeColorVarAlpha(segment.mode, isActive ? 19 : 13),
                      border: `2px solid ${modeColorVar(segment.mode)}`,
                      color: modeColorVar(segment.mode),
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
                      {MODE_ICON_PATH_BASE[segment.mode]}
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
                      className="text-text-subtle transition-transform duration-normal ease-ui"
                      style={{ transform: isActive ? 'rotate(180deg)' : 'rotate(0deg)' }}
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </div>
                </button>

                {/* Panneau de détail expandable */}
                {isActive && <SegmentDetail segment={segment} id={`segment-detail-${idx}`} />}
              </div>
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
