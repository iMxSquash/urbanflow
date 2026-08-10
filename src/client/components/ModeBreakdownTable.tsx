import type { TransportMode } from '@shared/types/index'
import { MODE_LABELS, modeColorToken } from '../constants/mode-icons'
import type { ModeCount } from '../services/gamification.service'

interface ModeBreakdownTableProps {
  data: ModeCount[]
}

/** Répartition par mode — tableau HTML natif : « le tableau est le graphique »
 * (MAQUETTE.md §4, a11y : préféré à un graphique image). */
export default function ModeBreakdownTable({ data }: ModeBreakdownTableProps) {
  if (data.length === 0) {
    return (
      <p className="text-body-sm text-text-muted text-center py-6">
        Aucun trajet enregistré ce mois
      </p>
    )
  }

  const total = data.reduce((sum, d) => sum + d.count, 0)
  const rows = [...data]
    .sort((a, b) => b.count - a.count)
    .map((d) => ({
      ...d,
      label: MODE_LABELS[d.mode as TransportMode] ?? d.mode,
      pct: Math.round((d.count / total) * 100),
    }))

  return (
    <table className="w-full border-collapse">
      <caption className="sr-only">
        Répartition des trajets par mode de transport ce mois-ci
      </caption>
      <thead>
        <tr>
          <th scope="col" className="text-left text-caption font-semibold text-text-subtle pb-1.5">
            Mode
          </th>
          <th scope="col" className="text-left text-caption font-semibold text-text-subtle pb-1.5">
            Part
          </th>
          <th scope="col" className="text-right text-caption font-semibold text-text-subtle pb-1.5">
            Trajets
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.mode}>
            <th scope="row" className="text-left py-1 text-body-sm font-semibold whitespace-nowrap">
              {row.label}
            </th>
            <td className="py-1 px-2.5">
              <span className="flex items-center gap-2">
                <span className="flex-1 h-2.5 rounded-full bg-surface-sunken">
                  <span
                    className="block h-2.5 rounded-full"
                    style={{
                      width: `${row.pct}%`,
                      backgroundColor: `var(--color-mode-${modeColorToken(row.mode as TransportMode)})`,
                    }}
                  />
                </span>
                <span className="text-caption text-text-muted tabular-nums w-8 text-right">
                  {row.pct}%
                </span>
              </span>
            </td>
            <td className="py-1 text-right text-body-sm font-semibold tabular-nums">{row.count}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
