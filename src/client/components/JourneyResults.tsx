import type { ReactNode } from 'react'
import type { Journey, TransportMode } from '@shared/types/index'

// ── Types ──────────────────────────────────────────────────────────────────

type RankLabel = 'recommended' | 'fastest' | 'greenest' | 'comfortable'

export interface JourneyResultsProps {
  journeys: Journey[]
  onSelect: (journey: Journey) => void
  onClose?: () => void
}

// ── Formatting helpers ─────────────────────────────────────────────────────

function formatDuration(min: number): string {
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m > 0 ? `${h}h${m.toString().padStart(2, '0')}` : `${h}h`
}

function formatCo2Saving(g: number): string {
  if (g <= 0) return 'Neutre'
  return g >= 1000 ? `${(g / 1000).toFixed(1)} kg` : `${Math.round(g)} g`
}

function formatCost(eur?: number): string {
  if (eur === undefined) return '—'
  if (eur === 0) return 'Gratuit'
  return `${eur.toFixed(2).replace('.', ',')} €`
}

function uniqueModes(journey: Journey): TransportMode[] {
  const seen = new Set<TransportMode>()
  return journey.segments.map(s => s.mode).filter(m => {
    if (seen.has(m)) return false
    seen.add(m)
    return true
  })
}

// ── Mode badge config ──────────────────────────────────────────────────────

const MODE_LABEL: Record<TransportMode, string> = {
  walk:    'Marche',
  bike:    'Vélo',
  tramway: 'Tramway',
  bus:     'Bus',
  scooter: 'Trottinette',
  navibus: 'Navibus',
  train:   'Train',
}

// Combines .mode-badge base class with color-specific classes from index.css
const MODE_BADGE_CLASS: Record<TransportMode, string> = {
  walk:    'mode-badge mode-badge-walk',
  bike:    'mode-badge mode-badge-bike',
  tramway: 'mode-badge mode-badge-tram',
  bus:     'mode-badge mode-badge-bus',
  navibus: 'mode-badge mode-badge-navibus',
  scooter: 'mode-badge bg-cyan-50 text-cyan-700',
  train:   'mode-badge bg-violet-50 text-violet-700',
}

// ── Rank badge config ──────────────────────────────────────────────────────

interface RankMeta {
  label:     string
  chipClass: string
  icon:      ReactNode
}

const RANK_META: Record<RankLabel, RankMeta> = {
  recommended: {
    label:     'Recommandé',
    chipClass: 'bg-eco-100 text-eco-800 border border-eco-200',
    icon: (
      <svg aria-hidden="true" width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    ),
  },
  fastest: {
    label:     'Plus rapide',
    chipClass: 'bg-transit-50 text-transit-700 border border-transit-200',
    icon: (
      <svg aria-hidden="true" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    ),
  },
  greenest: {
    label:     'Meilleur CO₂',
    chipClass: 'bg-eco-50 text-eco-700 border border-eco-200',
    icon: (
      <svg aria-hidden="true" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 8C8 10 5.9 16.17 3.82 22c2 0 7.68-1 13-6 2-2 3-5 3-8s-1-5-1-5l-1.82 5z" />
      </svg>
    ),
  },
  comfortable: {
    label:     'Confortable',
    chipClass: 'bg-slate-100 text-slate-600 border border-slate-200',
    icon: (
      <svg aria-hidden="true" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    ),
  },
}

// ── Rank computation ───────────────────────────────────────────────────────

function computeRanks(journeys: Journey[]): Map<string, RankLabel[]> {
  const map = new Map<string, RankLabel[]>(journeys.map(j => [j.id, []]))
  if (journeys.length === 0) return map

  const push = (id: string, rank: RankLabel) => map.get(id)!.push(rank)

  // Recommended: highest composite score
  push(journeys.reduce((b, j) => j.score > b.score ? j : b).id, 'recommended')

  if (journeys.length > 1) {
    // Fastest: lowest total duration
    push(journeys.reduce((b, j) => j.totalDurationMin < b.totalDurationMin ? j : b).id, 'fastest')

    // Greenest: highest CO2 saving vs car (only if any journey actually saves CO2)
    const maxCo2 = Math.max(...journeys.map(j => j.co2SavingG))
    if (maxCo2 > 0) {
      push(journeys.reduce((b, j) => j.co2SavingG > b.co2SavingG ? j : b).id, 'greenest')
    }

    // Comfortable: unlabeled journey with the highest comfortScore
    const unlabeled = journeys.filter(j => map.get(j.id)!.length === 0)
    if (unlabeled.length > 0) {
      const mostComfortable = unlabeled.reduce((best, j) =>
        (j.comfortScore ?? 0) > (best.comfortScore ?? 0) ? j : best
      )
      push(mostComfortable.id, 'comfortable')
    }
  }

  return map
}

function cardBorderClass(ranks: RankLabel[]): string {
  if (ranks.includes('recommended')) return 'border-l-4 border-eco-600'
  if (ranks.includes('fastest'))     return 'border-l-4 border-transit-500'
  if (ranks.includes('greenest'))    return 'border-l-4 border-eco-400'
  return 'border-l-4 border-slate-200'
}

// ── JourneyCard ────────────────────────────────────────────────────────────

interface JourneyCardProps {
  journey:    Journey
  ranks:      RankLabel[]
  onSelect:   (j: Journey) => void
  animDelay:  number
}

function JourneyCard({ journey, ranks, onSelect, animDelay }: JourneyCardProps) {
  const isRecommended = ranks.includes('recommended')
  const modes = uniqueModes(journey)
  const co2Label = journey.co2SavingG > 0
    ? `${formatCo2Saving(journey.co2SavingG)} de CO₂ économisé par rapport à la voiture`
    : 'Économie CO₂ neutre'

  return (
    <article
      className={[
        'bg-white rounded-card border border-slate-100 overflow-hidden animate-slide-up',
        cardBorderClass(ranks),
        isRecommended ? 'shadow-card-md' : 'shadow-card',
      ].join(' ')}
      style={{ animationDelay: `${animDelay}ms`, animationFillMode: 'both' }}
      aria-label={`Itinéraire ${journey.label}${isRecommended ? ', recommandé' : ''}`}
    >
      <div className="p-4">

        {/* ── Rank chips ── */}
        {ranks.length > 0 && (
          <ul className="flex flex-wrap gap-1.5 mb-3" aria-label="Classements">
            {ranks.map(rank => {
              const meta = RANK_META[rank]
              return (
                <li key={rank}>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-caption font-semibold ${meta.chipClass}`}
                  >
                    {meta.icon}
                    {meta.label}
                  </span>
                </li>
              )
            })}
          </ul>
        )}

        {/* ── Journey label ── */}
        <h3 className="text-body font-semibold text-slate-900 leading-tight mb-2">
          {journey.label}
        </h3>

        {/* ── Mode badges ── */}
        <ul className="flex flex-wrap gap-1 mb-4" aria-label="Modes de transport utilisés">
          {modes.map(mode => (
            <li key={mode}>
              <span className={MODE_BADGE_CLASS[mode]}>
                {MODE_LABEL[mode]}
              </span>
            </li>
          ))}
        </ul>

        {/* ── Stats grid ── */}
        <dl className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-slate-50 rounded-lg p-2.5 text-center">
            <dt className="text-caption text-slate-500 leading-none mb-1">Durée</dt>
            <dd className="text-body-sm font-bold text-slate-900 tabular-nums leading-tight">
              {formatDuration(journey.totalDurationMin)}
            </dd>
          </div>

          <div className="bg-eco-50 rounded-lg p-2.5 text-center">
            <dt className="text-caption text-slate-500 leading-none mb-1">
              <abbr title="CO₂ économisé par rapport à la voiture">CO₂ éco.</abbr>
            </dt>
            <dd
              className={`text-body-sm font-bold leading-tight tabular-nums ${journey.co2SavingG > 0 ? 'text-eco-700' : 'text-slate-500'}`}
              aria-label={co2Label}
            >
              {journey.co2SavingG > 0 ? `-${formatCo2Saving(journey.co2SavingG)}` : '—'}
            </dd>
          </div>

          <div className="bg-slate-50 rounded-lg p-2.5 text-center">
            <dt className="text-caption text-slate-500 leading-none mb-1">Coût</dt>
            <dd className="text-body-sm font-bold text-slate-900 leading-tight">
              {formatCost(journey.estimatedCostEur)}
            </dd>
          </div>
        </dl>

        {/* ── CTA ── */}
        <button
          type="button"
          onClick={() => onSelect(journey)}
          aria-label={`Choisir l'itinéraire : ${journey.label}`}
          className={`w-full justify-center ${isRecommended ? 'btn-primary' : 'btn-secondary'}`}
        >
          Choisir cet itinéraire
        </button>

      </div>
    </article>
  )
}

// ── JourneyResults ─────────────────────────────────────────────────────────

export function JourneyResults({ journeys, onSelect, onClose }: JourneyResultsProps) {
  if (journeys.length === 0) return null

  const ranks = computeRanks(journeys)

  // Recommended first, then descending score
  const sorted = [...journeys].sort((a, b) => {
    const aRec = ranks.get(a.id)!.includes('recommended')
    const bRec = ranks.get(b.id)!.includes('recommended')
    if (aRec !== bRec) return aRec ? -1 : 1
    return b.score - a.score
  })

  const count = journeys.length
  const headingText = `${count} itinéraire${count > 1 ? 's' : ''} trouvé${count > 1 ? 's' : ''}`

  return (
    <section aria-label="Résultats des itinéraires">

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-h3 font-bold text-slate-900">{headingText}</h2>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer les résultats"
            className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eco-600"
          >
            <svg aria-hidden="true" width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M1 1l12 12M13 1L1 13" />
            </svg>
          </button>
        ) : count > 1 ? (
          <span className="text-caption text-slate-500">Comparaison</span>
        ) : null}
      </div>

      {/* Cards */}
      <ul className="space-y-3" aria-label="Liste des itinéraires">
        {sorted.map((journey, index) => (
          <li key={journey.id}>
            <JourneyCard
              journey={journey}
              ranks={ranks.get(journey.id) ?? []}
              onSelect={onSelect}
              animDelay={index * 80}
            />
          </li>
        ))}
      </ul>

    </section>
  )
}
