import { useState } from 'react'
import type { ModeCount } from '../services/gamification.service'

const MODE_COLORS: Record<string, string> = {
  walk: '#94a3b8',
  bike: '#4ade80',
  tramway: '#818cf8',
  bus: '#fcd34d',
  scooter: '#22d3ee',
  navibus: '#38bdf8',
  train: '#a78bfa',
}

const MODE_LABELS: Record<string, string> = {
  walk: 'Marche',
  bike: 'Vélo',
  tramway: 'Tramway',
  bus: 'Bus',
  scooter: 'Trottinette',
  navibus: 'Navibus',
  train: 'Train',
}

const DEFAULT_COLOR = '#6ee7b7'

interface ModePieChartProps {
  data: ModeCount[]
  tripCount: number
}

const CX = 100
const CY = 88
const OUTER_R = 70
const INNER_R = 36
// Legend is a vertical list to the right of the donut
const LEGEND_X = 200
const LEGEND_START_Y = 40
const LEGEND_ROW_H = 22
const VW = 390
const VH = 200

function slicePath(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number
): string {
  const x1 = cx + r * Math.cos(startAngle)
  const y1 = cy + r * Math.sin(startAngle)
  const x2 = cx + r * Math.cos(endAngle)
  const y2 = cy + r * Math.sin(endAngle)
  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0
  return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`
}

export default function ModePieChart({ data, tripCount }: ModePieChartProps) {
  const [hovered, setHovered] = useState<string | null>(null)

  if (data.length === 0) {
    return (
      <div className="h-40 flex items-center justify-center text-body-sm text-text-muted">
        Aucun trajet enregistré ce mois
      </div>
    )
  }

  const total = data.reduce((sum, d) => sum + d.count, 0)
  const cumulative = data.reduce<number[]>((acc, d) => {
    acc.push((acc[acc.length - 1] ?? 0) + d.count / total)
    return acc
  }, [])
  const slices = data.map((d, i) => {
    const startAngle = -Math.PI / 2 + (cumulative[i - 1] ?? 0) * 2 * Math.PI
    const endAngle = -Math.PI / 2 + (cumulative[i] ?? 0) * 2 * Math.PI
    return {
      mode: d.mode,
      count: d.count,
      pct: Math.round((d.count / total) * 100),
      name: MODE_LABELS[d.mode] ?? d.mode,
      color: MODE_COLORS[d.mode] ?? DEFAULT_COLOR,
      path: slicePath(CX, CY, OUTER_R, startAngle, endAngle),
    }
  })

  const hoveredSlice = hovered ? slices.find((s) => s.mode === hovered) : null

  return (
    <svg
      viewBox={`0 0 ${VW} ${VH}`}
      width="100%"
      role="img"
      aria-label="Répartition des modes de transport"
    >
      {/* Pie slices */}
      {slices.map((s) => (
        <path
          key={s.mode}
          d={s.path}
          fill={s.color}
          stroke="none"
          opacity={hovered && hovered !== s.mode ? 0.35 : 1}
          style={{ transition: 'opacity 120ms', cursor: 'pointer', outline: 'none' }}
          tabIndex={0}
          role="img"
          aria-label={`${s.name} : ${s.count} trajet${s.count > 1 ? 's' : ''} (${s.pct}%)`}
          onMouseEnter={() => setHovered(s.mode)}
          onMouseLeave={() => setHovered(null)}
          onFocus={() => setHovered(s.mode)}
          onBlur={() => setHovered(null)}
        />
      ))}

      {/* Donut hole */}
      <circle
        cx={CX}
        cy={CY}
        r={INNER_R}
        style={{ fill: 'var(--color-bg-card)' }}
        pointerEvents="none"
      />

      {/* Center label */}
      {hoveredSlice ? (
        <g pointerEvents="none">
          <text
            x={CX}
            y={CY - 6}
            textAnchor="middle"
            fontSize={11}
            style={{ fill: 'var(--color-text-primary)' }}
            fontWeight="700"
          >
            {hoveredSlice.name}
          </text>
          <text
            x={CX}
            y={CY + 9}
            textAnchor="middle"
            fontSize={10}
            style={{ fill: 'var(--color-text-muted)' }}
          >
            {hoveredSlice.count} trajet{hoveredSlice.count > 1 ? 's' : ''}
          </text>
          <text
            x={CX}
            y={CY + 23}
            textAnchor="middle"
            fontSize={10}
            style={{ fill: 'var(--color-text-muted)' }}
          >
            {hoveredSlice.pct}%
          </text>
        </g>
      ) : (
        <text
          x={CX}
          y={CY + 5}
          textAnchor="middle"
          fontSize={11}
          style={{ fill: 'var(--color-text-muted)' }}
          pointerEvents="none"
        >
          {tripCount} trajet{tripCount > 1 ? 's' : ''}
        </text>
      )}

      {/* Legend — vertical list to the right of donut */}
      {slices.map((s, i) => {
        const ly = LEGEND_START_Y + i * LEGEND_ROW_H
        return (
          <g key={s.mode}>
            <circle cx={LEGEND_X + 6} cy={ly} r={5} fill={s.color} />
            <text
              x={LEGEND_X + 18}
              y={ly + 4}
              fontSize={11}
              style={{ fill: 'var(--color-text-secondary)' }}
            >
              {s.name}
            </text>
            <text
              x={VW - 4}
              y={ly + 4}
              fontSize={11}
              textAnchor="end"
              style={{ fill: 'var(--color-text-muted)' }}
            >
              {s.pct}%
            </text>
          </g>
        )
      })}
    </svg>
  )
}
