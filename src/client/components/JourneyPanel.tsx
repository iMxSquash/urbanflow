import type { Journey, TransportMode, WeatherCondition } from '@shared/types/index'
import { WeatherBadge } from './WeatherBadge'

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

function formatDuration(min: number): string {
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m > 0 ? `${h}h${m.toString().padStart(2, '0')}` : `${h}h`
}

function formatCo2(grams: number): string {
  return grams >= 1000 ? `${(grams / 1000).toFixed(1)} kg` : `${grams} g`
}

interface JourneyPanelProps {
  journey: Journey
  onClose: () => void
  weather?: WeatherCondition | null
}

export function JourneyPanel({ journey, onClose, weather }: JourneyPanelProps) {
  return (
    <div
      className={[
        'absolute z-1100 bg-white overflow-y-auto',
        // mobile : bottom sheet
        'bottom-0 left-0 right-0 max-h-[58vh] rounded-t-2xl',
        'shadow-[0_-8px_32px_rgba(0,0,0,0.12)]',
        // desktop : panneau latéral droit
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
            <p className="text-caption text-slate-400 mt-0.5">Meilleur itinéraire</p>
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
            <p className="text-caption text-slate-500 mb-0.5">Durée</p>
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
        </p>
        <ol className="space-y-0">
          {journey.segments.map((segment, idx) => (
            <li key={idx} className="flex gap-3 relative">
              {/* Ligne verticale entre segments */}
              {idx < journey.segments.length - 1 && (
                <div
                  aria-hidden="true"
                  className="absolute left-3.75 top-9 bottom-0 w-0.5 opacity-25"
                  style={{ background: MODE_COLORS[segment.mode] }}
                />
              )}

              {/* Icône mode */}
              <div
                aria-hidden="true"
                className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm z-10 mt-0.5"
                style={{
                  background: MODE_COLORS[segment.mode] + '20',
                  border: `2px solid ${MODE_COLORS[segment.mode]}`,
                }}
              >
                {MODE_ICONS[segment.mode]}
              </div>

              {/* Contenu */}
              <div className="pb-4 min-w-0 flex-1">
                <p className="text-body-sm font-medium text-slate-800 leading-snug truncate">
                  {segment.lineName ?? MODE_LABELS[segment.mode]}
                </p>
                <p className="text-caption text-slate-400 mt-0.5">
                  {formatDuration(segment.durationMin)}
                  {segment.distanceKm > 0 && ` · ${segment.distanceKm} km`}
                  {segment.co2g > 0 && ` · ${segment.co2g} g CO₂`}
                </p>
              </div>
            </li>
          ))}
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
      </div>
    </div>
  )
}
