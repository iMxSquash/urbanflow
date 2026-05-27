import type {
  JourneyOptions,
  JourneySegment,
  TransportMode,
  UserPreference,
  WeatherCondition,
} from '@shared/types/index.js'
import { CO2_FACTORS } from '@shared/constants/co2-factors.js'

const TC_MODES: TransportMode[] = ['bus', 'tramway', 'navibus', 'train']

export const NAOLIB_TICKET_EUR = 1.7

// ─── Coût estimé ──────────────────────────────────────────────────────────────

export function computeEstimatedCost(segments: JourneySegment[]): number {
  return segments.some((s) => TC_MODES.includes(s.mode)) ? NAOLIB_TICKET_EUR : 0
}

// ─── Pondérations ─────────────────────────────────────────────────────────────

interface Weights {
  duration: number
  co2: number
  comfort: number
}

export function scoringWeights(preference: UserPreference): Weights {
  switch (preference) {
    case 'eco':
      return { duration: 0.2, co2: 0.7, comfort: 0.1 }
    case 'fast':
      return { duration: 0.7, co2: 0.2, comfort: 0.1 }
    default:
      return { duration: 0.4, co2: 0.5, comfort: 0.1 }
  }
}

// ─── Score confort ────────────────────────────────────────────────────────────

export function computeComfortScore(
  segments: JourneySegment[],
  options: JourneyOptions,
  weather?: WeatherCondition | null
): number {
  const preferredModes = options.modes ?? []
  const pmr = options.pmrAccessibility ?? false

  // PMR : seuil de marche réduit à 5 min, et le vélo est fortement pénalisé
  const maxWalk = pmr ? Math.min(options.maxWalkMinutes ?? 30, 5) : (options.maxWalkMinutes ?? 30)

  // Base : ratio de segments utilisant un mode préféré (50 si aucune préférence)
  let base =
    preferredModes.length > 0 && segments.length > 0
      ? Math.round(
          (segments.filter((s) => preferredModes.includes(s.mode)).length / segments.length) * 100
        )
      : 50

  // Pénalité si un segment marche dépasse le seuil
  const maxWalkSeg = segments
    .filter((s) => s.mode === 'walk')
    .reduce((max, s) => Math.max(max, s.durationMin), 0)

  if (maxWalkSeg > maxWalk) {
    // Pénalité plus sévère si PMR (−60) que pour un utilisateur standard (−40)
    base = Math.max(0, base - (pmr ? 60 : 40))
  }

  // PMR : pénalité supplémentaire si le trajet contient du vélo
  if (pmr && segments.some((s) => s.mode === 'bike')) {
    base = Math.max(0, base - 50)
  }

  // Météo : pluie/neige/orage → pénalise le vélo, prime les TC couverts
  if (weather) {
    const isWet = ['rain', 'snow', 'thunderstorm'].includes(weather.condition)
    const isWindy = weather.windSpeed > 40
    const hasBike = segments.some((s) => s.mode === 'bike')
    // At least one covered TC segment required — walk-only does not qualify for shelter bonus
    const isPureTC = segments.some((s) => TC_MODES.includes(s.mode)) && !hasBike

    if ((isWet || isWindy) && hasBike) base = Math.max(0, base - 30)
    if (isWet && isPureTC) base = Math.min(100, base + 10)
  }

  return base
}

// ─── Score final ──────────────────────────────────────────────────────────────

export function computeScore(
  segments: JourneySegment[],
  totalDurationMin: number,
  totalDistKm: number,
  totalCo2g: number,
  options: JourneyOptions,
  weather?: WeatherCondition | null
): number {
  const w = scoringWeights(options.preference)

  const durationScore = Math.max(0, 100 - (totalDurationMin / 120) * 100)

  const maxCo2 = totalDistKm * CO2_FACTORS.car
  const co2Score = maxCo2 > 0 ? Math.max(0, (1 - totalCo2g / maxCo2) * 100) : 100

  const comfort = computeComfortScore(segments, options, weather)

  return Math.round(w.duration * durationScore + w.co2 * co2Score + w.comfort * comfort)
}
