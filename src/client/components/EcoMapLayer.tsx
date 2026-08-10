import { Polyline } from 'react-leaflet'
import type { Journey } from '@shared/types/index'
import { useIsDarkMode } from '../hooks/use-is-dark-mode'

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function lerp(a: number, b: number, t: number) {
  return Math.round(a + (b - a) * t)
}

// Dégradé faible → fort CO2, aligné sur les tokens --color-eco-600 (faible) →
// --color-warning (moyen) → --color-danger (fort) de index.css — pas de valeurs
// Tailwind arbitraires. Dupliqué en JS (comme MODE_COLORS_LIGHT ailleurs) car
// c'est un attribut de présentation SVG Leaflet, hors cascade CSS (var() non
// fiable) ; interpolation continue donc pas de classe CSS statique possible
// (contrairement aux tracés à couleur fixe de JourneyLayer/TanStopsLayer).
const CO2_GRADIENT_STOPS = {
  light: { low: '#0b5c43', mid: '#7a4a08', high: '#b3261e' },
  dark: { low: '#4fcb9b', mid: '#e9a93c', high: '#f0736b' },
}

function co2Color(value: number, min: number, max: number, isDark: boolean): string {
  const stops = CO2_GRADIENT_STOPS[isDark ? 'dark' : 'light']
  const t = max === min ? 0 : (value - min) / (max - min)
  const [rgbA, rgbB, localT] =
    t <= 0.5
      ? [hexToRgb(stops.low), hexToRgb(stops.mid), t * 2]
      : [hexToRgb(stops.mid), hexToRgb(stops.high), (t - 0.5) * 2]
  const [r, g, b] = [
    lerp(rgbA[0], rgbB[0], localT),
    lerp(rgbA[1], rgbB[1], localT),
    lerp(rgbA[2], rgbB[2], localT),
  ]
  return `rgb(${r},${g},${b})`
}

interface EcoMapLayerProps {
  journeys: Journey[]
  selectedJourneyId?: string | null
  onSelect: (journey: Journey) => void
}

export function EcoMapLayer({ journeys, selectedJourneyId, onSelect }: EcoMapLayerProps) {
  const isDark = useIsDarkMode()
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
            : [
                [seg.from.lat, seg.from.lng],
                [seg.to.lat, seg.to.lng],
              ]
        )
        return (
          <Polyline
            key={journey.id}
            positions={positions}
            eventHandlers={{ click: () => onSelect(journey) }}
            pathOptions={{
              color: co2Color(journey.totalCo2g, min, max, isDark),
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
