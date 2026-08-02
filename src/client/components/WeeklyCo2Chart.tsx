import type { WeeklyBar } from '../services/gamification.service'

interface WeeklyCo2ChartProps {
  data: WeeklyBar[]
}

function formatWeekLabel(weekStart: string): string {
  const d = new Date(`${weekStart}T00:00:00`)
  const week = Math.ceil(
    (d.getTime() - new Date(d.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000)
  )
  return `S${week}`
}

function formatCo2(grams: number): string {
  return (grams / 1000).toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
}

/** Barres CSS — valeurs toujours visibles (pas de tooltip requis), semaine en
 * cours distinguée par couleur ET graisse (jamais la couleur seule, MAQUETTE.md §1.9). */
export default function WeeklyCo2Chart({ data }: WeeklyCo2ChartProps) {
  const isEmpty = data.every((d) => d.co2SavedGrams === 0)
  if (isEmpty) {
    return (
      <div className="h-27 flex items-center justify-center text-body-sm text-text-subtle">
        Aucun trajet enregistré ces 4 dernières semaines
      </div>
    )
  }

  const maxVal = Math.max(...data.map((d) => d.co2SavedGrams), 1)

  return (
    <div className="flex items-end gap-2.5 h-27">
      {data.map((d, i) => {
        const isCurrent = i === data.length - 1
        const heightPct = Math.max((d.co2SavedGrams / maxVal) * 100, 4)
        return (
          <div key={d.weekStart} className="flex-1 flex flex-col items-center gap-1.5">
            <span
              className={[
                'text-caption tabular-nums',
                isCurrent ? 'font-bold text-primary' : 'font-semibold text-text',
              ].join(' ')}
            >
              {formatCo2(d.co2SavedGrams)}
            </span>
            <div className="w-full flex items-end h-19">
              <span
                className="block w-full rounded-t-sm"
                style={{
                  height: `${heightPct}%`,
                  backgroundColor: isCurrent ? 'var(--color-primary)' : 'var(--color-primary-weak)',
                }}
              />
            </div>
            <span
              className={[
                'text-caption',
                isCurrent ? 'font-bold text-primary' : 'text-text-muted',
              ].join(' ')}
            >
              {formatWeekLabel(d.weekStart)}
            </span>
          </div>
        )
      })}
    </div>
  )
}
