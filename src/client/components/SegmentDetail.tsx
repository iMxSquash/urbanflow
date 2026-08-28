import type { JourneySegment, TransportMode } from '@shared/types/index'
import { TC_TRANSPORT_MODES } from '@shared/constants/transport-modes'
import {
  avgSpeedKmh,
  caloriesBurned,
  co2SavedVsCarG,
  estimatedNextDepartures,
} from '../utils/journey-segment-info'
import { formatCo2, formatDuration, formatTime } from '../utils/format-journey'

const TC_MODES = new Set<TransportMode>(TC_TRANSPORT_MODES)

interface SegmentDetailProps {
  segment: JourneySegment
  id: string
}

export function SegmentDetail({ segment, id }: SegmentDetailProps) {
  const isTc = TC_MODES.has(segment.mode)
  const speed = avgSpeedKmh(segment.distanceKm, segment.durationMin)
  const calories = caloriesBurned(segment.mode, segment.durationMin)
  const nextDeps = segment.scheduledDeparture
    ? estimatedNextDepartures(segment.mode, segment.scheduledDeparture)
    : []
  const co2SavedG = co2SavedVsCarG(segment.distanceKm, segment.co2g)

  return (
    <div
      id={id}
      className="ml-11 mt-2 mb-2 rounded-xl border border-border bg-surface-sunken p-3 space-y-3"
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
          <p className="text-body-sm font-bold text-text tabular-nums">{segment.distanceKm} km</p>
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
