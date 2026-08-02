import type { SearchOptions } from './MapSheet'

interface Adjustment {
  key: string
  label: string
  subtitle: string
  icon: React.ReactNode
  apply: (options: SearchOptions) => SearchOptions
}

const ADJUSTMENTS: Adjustment[] = [
  {
    key: 'walk',
    label: 'Porter la marche max à 15 min',
    subtitle: 'actuellement {current} min',
    icon: (
      <>
        <circle cx="12" cy="4" r="2" />
        <path d="M12 6v5l-3 3 1 5M12 11l3 3v5" />
      </>
    ),
    apply: (o) => ({ ...o, maxWalkMinutes: 15 }),
  },
  {
    key: 'bus',
    label: 'Autoriser le bus',
    subtitle: 'désactivé',
    icon: (
      <>
        <rect x="4" y="4" width="16" height="13" rx="2" />
        <path d="M4 12h16M7.5 20v-3M16.5 20v-3" />
      </>
    ),
    apply: (o) => ({ ...o, modes: [...o.modes, 'bus'] }),
  },
]

interface EmptyResultsPanelProps {
  time: string
  options: SearchOptions
  onOptionsChange: (o: SearchOptions) => void
  /** Absent en panneau desktop : les réglages y sont déjà en ligne, jamais repliés. */
  onOpenSettings?: () => void
}

/** État « Aucun résultat » (MAQUETTE.md §5.7 / 6.1) — nomme la contrainte
 * bloquante et propose les assouplissements applicables en un tap. */
export function EmptyResultsPanel({
  time,
  options,
  onOptionsChange,
  onOpenSettings,
}: EmptyResultsPanelProps) {
  const suggestions = ADJUSTMENTS.filter((a) => {
    if (a.key === 'walk') return options.maxWalkMinutes < 15
    if (a.key === 'bus') return !options.modes.includes('bus')
    return true
  })

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <span className="size-11 rounded-md bg-warning-surface flex items-center justify-center shrink-0">
          <svg
            aria-hidden="true"
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-warning"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-4.5-4.5M8.5 11h5" />
          </svg>
        </span>
        <span className="flex flex-col gap-1">
          <span className="text-body-lg font-bold">Aucun itinéraire trouvé</span>
          <span className="text-body-sm text-text-muted leading-snug">
            Vos réglages sont trop restrictifs pour ce trajet à {time}.
          </span>
        </span>
      </div>

      {suggestions.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <span className="text-caption font-bold tracking-[0.06em] uppercase text-text-subtle">
            Ajustements suggérés
          </span>
          {suggestions.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => onOptionsChange(s.apply(options))}
              className="flex items-center gap-2.5 p-3.5 rounded-md border border-border bg-surface text-left"
            >
              <svg
                aria-hidden="true"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-primary shrink-0"
              >
                {s.icon}
              </svg>
              <span className="flex-1 flex flex-col gap-0.5">
                <span className="text-body-sm font-semibold">{s.label}</span>
                <span className="text-caption text-text-muted">
                  {s.subtitle.replace('{current}', String(options.maxWalkMinutes))}
                </span>
              </span>
              <svg
                aria-hidden="true"
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-text-muted shrink-0"
              >
                <path d="M9 6l6 6-6 6" />
              </svg>
            </button>
          ))}
        </div>
      )}

      {onOpenSettings && (
        <button type="button" onClick={onOpenSettings} className="btn-secondary w-full">
          Ouvrir les réglages avancés
        </button>
      )}
    </div>
  )
}
