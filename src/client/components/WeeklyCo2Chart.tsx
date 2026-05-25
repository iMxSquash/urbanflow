import { useState } from 'react'
import type { WeeklyBar } from '../services/gamification.service'

interface WeeklyCo2ChartProps {
  data: WeeklyBar[]
}

function formatWeekLabel(weekStart: string): string {
  const d = new Date(weekStart)
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

function formatCo2(grams: number): string {
  return grams >= 1000 ? `${(grams / 1000).toFixed(1)} kg` : `${grams} g`
}

const VW = 400
const VH = 180
const PAD_T = 12
const PAD_R = 8
const PAD_B = 28
const PAD_L = 42
const IW = VW - PAD_L - PAD_R
const IH = VH - PAD_T - PAD_B
const TIP_W = 92
const TIP_H = 38

interface Tip {
  cx: number
  top: number
  label: string
  value: number
}

export default function WeeklyCo2Chart({ data }: WeeklyCo2ChartProps) {
  const [tip, setTip] = useState<Tip | null>(null)

  const isEmpty = data.every((d) => d.co2SavedGrams === 0)
  if (isEmpty) {
    return (
      <div className="h-40 flex items-center justify-center text-body-sm text-slate-400">
        Aucun trajet enregistré ces 4 dernières semaines
      </div>
    )
  }

  const maxVal = Math.max(...data.map((d) => d.co2SavedGrams), 1)
  const slotW = IW / data.length
  const barW = Math.min(slotW * 0.6, 48)
  const yTicks = [0, Math.round(maxVal / 2), maxVal]

  let tipEl: React.ReactNode = null
  if (tip) {
    const tx = Math.min(Math.max(tip.cx - TIP_W / 2, PAD_L), PAD_L + IW - TIP_W)
    const ty = Math.max(tip.top - TIP_H - 6, 4)
    tipEl = (
      <g pointerEvents="none">
        <rect
          x={tx}
          y={ty}
          width={TIP_W}
          height={TIP_H}
          rx={6}
          fill="white"
          stroke="#e2e8f0"
          strokeWidth={1}
        />
        <text
          x={tx + TIP_W / 2}
          y={ty + 14}
          textAnchor="middle"
          fontSize={10}
          fill="#475569"
          fontWeight="600"
        >
          {tip.label}
        </text>
        <text
          x={tx + TIP_W / 2}
          y={ty + 29}
          textAnchor="middle"
          fontSize={10}
          fill="#16a34a"
          fontWeight="700"
        >
          {formatCo2(tip.value)} éco.
        </text>
      </g>
    )
  }

  return (
    <svg viewBox={`0 0 ${VW} ${VH}`} width="100%" role="img" aria-label="Économies CO₂ par semaine">
      {/* Gridlines + Y labels */}
      {yTicks.map((tick) => {
        const y = PAD_T + IH - (tick / maxVal) * IH
        return (
          <g key={tick}>
            <line x1={PAD_L} y1={y} x2={PAD_L + IW} y2={y} stroke="#f1f5f9" strokeWidth={1} />
            <text x={PAD_L - 6} y={y + 4} textAnchor="end" fontSize={10} fill="#94a3b8">
              {formatCo2(tick)}
            </text>
          </g>
        )
      })}

      {/* Bars + X labels */}
      {data.map((d, i) => {
        const barH = Math.max((d.co2SavedGrams / maxVal) * IH, 2)
        const bx = PAD_L + i * slotW + (slotW - barW) / 2
        const by = PAD_T + IH - barH
        const cx = bx + barW / 2
        const label = formatWeekLabel(d.weekStart)
        return (
          <g key={i}>
            <rect
              x={bx}
              y={by}
              width={barW}
              height={barH}
              fill="#16a34a"
              rx={3}
              onMouseEnter={() => setTip({ cx, top: by, label, value: d.co2SavedGrams })}
              onMouseLeave={() => setTip(null)}
            />
            <text x={cx} y={VH - 6} textAnchor="middle" fontSize={10} fill="#94a3b8">
              {label}
            </text>
          </g>
        )
      })}

      {tipEl}
    </svg>
  )
}
