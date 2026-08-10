import type { WeatherCondition } from '@shared/types/index'
import { WEATHER_ICON_PATH_BASE } from '../constants/weather-icons'

const CONDITION_LABEL: Record<WeatherCondition['condition'], string> = {
  clear: 'Dégagé',
  clouds: 'Nuageux',
  rain: 'Pluvieux',
  snow: 'Neige',
  thunderstorm: 'Orage',
}

function WeatherIcon({
  condition,
  size = 16,
}: {
  condition: WeatherCondition['condition']
  size?: number
}) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0"
    >
      {WEATHER_ICON_PATH_BASE[condition]}
    </svg>
  )
}

interface WeatherBadgeProps {
  weather: WeatherCondition
  /** "map" = pill flottant sur la carte ; "panel" = ligne inline dans le panneau trajet */
  variant?: 'map' | 'panel'
}

export function WeatherBadge({ weather, variant = 'map' }: WeatherBadgeProps) {
  const label = CONDITION_LABEL[weather.condition]
  const ariaLabel = `Météo Nantes : ${label}, ${weather.temperature}°C, vent ${weather.windSpeed} km/h`

  if (variant === 'panel') {
    return (
      <div className="flex items-center gap-2 text-caption text-text-subtle" aria-label={ariaLabel}>
        <WeatherIcon condition={weather.condition} size={14} />
        <span>
          {weather.temperature}°C · {weather.description}
          {weather.windSpeed > 40 && (
            <span className="text-warning font-medium"> · Vent fort {weather.windSpeed} km/h</span>
          )}
        </span>
      </div>
    )
  }

  return (
    <div
      // Pas de backdrop-blur (glassmorphism proscrit direction Estuaire) —
      // simple fond translucide opaque à la couleur de surface du thème.
      className="flex items-center gap-1.5 bg-surface/90 rounded-full px-3 py-1.5 shadow-card text-body-sm text-text select-none"
      aria-label={ariaLabel}
      role="status"
    >
      <WeatherIcon condition={weather.condition} />
      <span className="font-medium">{weather.temperature}°C</span>
      <span className="text-text-subtle hidden sm:inline">· {label}</span>
    </div>
  )
}
