import { Polyline } from 'react-leaflet'
import type { Journey } from '@shared/types/index'

function lerp(a: number, b: number, t: number) {
  return Math.round(a + (b - a) * t)
}

// green(22,163,74) → amber(245,158,11) → red(239,68,68)
function co2Color(value: number, min: number, max: number): string {
  const t = max === min ? 0 : (value - min) / (max - min)
  const [r, g, b] =
    t <= 0.5
      ? [lerp(22, 245, t * 2), lerp(163, 158, t * 2), lerp(74, 11, t * 2)]
      : [lerp(245, 239, (t - 0.5) * 2), lerp(158, 68, (t - 0.5) * 2), lerp(11, 68, (t - 0.5) * 2)]
  return `rgb(${r},${g},${b})`
}

interface EcoMapLayerProps {
  journeys: Journey[]
  selectedJourneyId?: string | null
  onSelect: (journey: Journey) => void
}

export function EcoMapLayer({ journeys, selectedJourneyId, onSelect }: EcoMapLayerProps) {
  if (journeys.length === 0) return null
  const co2Values = journeys.map((j) => j.totalCo2g)
  const min = Math.min(...co2Values)
  const max = Math.max(...co2Values)
  const hasSelection = !!selectedJourneyId

  return (
    <>
      {journeys.map((journey) => {
        const isSelected = journey.id === selectedJourneyId
        const positions: [number, number][] = journey.segments.flatMap((seg) =>
          seg.shape && seg.shape.length >= 2
            ? seg.shape.map((c): [number, number] => [c.lat, c.lng])
            : [[seg.from.lat, seg.from.lng], [seg.to.lat, seg.to.lng]]
        )
        return (
          <Polyline
            key={journey.id}
            positions={positions}
            eventHandlers={{ click: () => onSelect(journey) }}
            pathOptions={{
              color: co2Color(journey.totalCo2g, min, max),
              weight: isSelected ? 9 : 7,
              opacity: hasSelection && !isSelected ? 0.2 : 0.9,
              lineCap: 'round',
              lineJoin: 'round',
            }}
          />
        )
      })}
    </>
  )
}
