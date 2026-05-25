import { useState } from 'react'
import type { ModeCount } from '../services/gamification.service'

const MODE_COLORS: Record<string, string> = {
  walk: '#94a3b8',
  bike: '#16a34a',
  tramway: '#6366f1',
  bus: '#f59e0b',
  scooter: '#0891b2',
  navibus: '#0ea5e9',
  train: '#7c3aed',
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

const DEFAULT_COLOR = '#cbd5e1'

interface ModePieChartProps {
  data: ModeCount[]
  tripCount: number
}

const CX = 160
const CY = 88
const OUTER_R = 70
const INNER_R = 36
const VW = 380
const LEGEND_Y = CY + OUTER_R + 20
const PER_ROW = 3

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
      <div className="h-40 flex items-center justify-center text-body-sm text-slate-400">
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
      name: MODE_LABELS[d.mode] ?? d.mode,
      color: MODE_COLORS[d.mode] ?? DEFAULT_COLOR,
      path: slicePath(CX, CY, OUTER_R, startAngle, endAngle),
    }
  })

  const legendRows = Math.ceil(data.length / PER_ROW)
  const VH = LEGEND_Y + legendRows * 20 + 4

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
          stroke="white"
          strokeWidth={2}
          opacity={hovered && hovered !== s.mode ? 0.45 : 1}
          style={{ transition: 'opacity 120ms', cursor: 'pointer', outline: 'none' }}
          tabIndex={0}
          role="img"
          aria-label={`${s.name} : ${s.count} trajet${s.count > 1 ? 's' : ''} (${Math.round((s.count / total) * 100)}%)`}
          onMouseEnter={() => setHovered(s.mode)}
          onMouseLeave={() => setHovered(null)}
          onFocus={() => setHovered(s.mode)}
          onBlur={() => setHovered(null)}
        />
      ))}

      {/* Donut hole */}
      <circle cx={CX} cy={CY} r={INNER_R} fill="white" pointerEvents="none" />

      {/* Center label */}
      {hoveredSlice ? (
        <g pointerEvents="none">
          <text x={CX} y={CY - 6} textAnchor="middle" fontSize={11} fill="#1e293b" fontWeight="700">
            {hoveredSlice.name}
          </text>
          <text x={CX} y={CY + 9} textAnchor="middle" fontSize={10} fill="#64748b">
            {hoveredSlice.count} trajet{hoveredSlice.count > 1 ? 's' : ''}
          </text>
          <text x={CX} y={CY + 23} textAnchor="middle" fontSize={10} fill="#64748b">
            {Math.round((hoveredSlice.count / total) * 100)}%
          </text>
        </g>
      ) : (
        <text
          x={CX}
          y={CY + 5}
          textAnchor="middle"
          fontSize={11}
          fill="#94a3b8"
          pointerEvents="none"
        >
          {tripCount} trajet{tripCount > 1 ? 's' : ''}
        </text>
      )}

      {/* Legend */}
      {slices.map((s, i) => {
        const col = i % PER_ROW
        const row = Math.floor(i / PER_ROW)
        const lx = (VW / PER_ROW) * col + 12
        const ly = LEGEND_Y + row * 20
        return (
          <g key={s.mode}>
            <circle cx={lx + 5} cy={ly} r={5} fill={s.color} />
            <text x={lx + 14} y={ly + 4} fontSize={11} fill="#64748b">
              {s.name} · {s.count}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
