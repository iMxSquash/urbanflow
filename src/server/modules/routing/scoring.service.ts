import type {
  JourneyOptions,
  JourneySegment,
  UserPreference,
  WeatherCondition,
} from '@shared/types/index.js'
import { CO2_FACTORS } from '@shared/constants/co2-factors.js'
import { TC_TRANSPORT_MODES } from '@shared/constants/transport-modes.js'
import { SCORING_WEIGHTS } from '@shared/constants/scoring-weights.js'
import type { ScoringWeights } from '@shared/constants/scoring-weights.js'

const TC_MODES = TC_TRANSPORT_MODES

export const NAOLIB_TICKET_EUR = 1.7

// ─── Coût estimé ──────────────────────────────────────────────────────────────

export function computeEstimatedCost(segments: JourneySegment[]): number {
  return segments.some((s) => TC_MODES.includes(s.mode)) ? NAOLIB_TICKET_EUR : 0
}

// ─── Pondérations ─────────────────────────────────────────────────────────────

export function scoringWeights(preference: UserPreference): ScoringWeights {
  return SCORING_WEIGHTS[preference]
}

// ─── Seuil marche effectif ────────────────────────────────────────────────────

// PMR réduit le seuil de marche à 5 min (filtre dur routing.service.ts ET
// pénalité confort ci-dessous partagent cette même formule).
export function effectiveMaxWalkMinutes(options: JourneyOptions): number {
  const maxWalkMinutes = options.maxWalkMinutes ?? 30
  return options.pmrAccessibility ? Math.min(maxWalkMinutes, 5) : maxWalkMinutes
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
  const maxWalk = effectiveMaxWalkMinutes(options)

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

  // Dénivelé : aucune donnée d'altimétrie réelle disponible (OSRM public ne fournit
  // pas de profil DEM pour le profil driving utilisé, cf. CLAUDE.md). Approximation :
  // pénalise le confort dès qu'un segment vélo est présent — seul mode réellement
  // affecté par le relief dans ce produit — plutôt que d'ignorer le réglage.
  if (options.avoidElevation && segments.some((s) => s.mode === 'bike')) {
    base = Math.max(0, base - 30)
  }

  // Météo : pluie/neige/orage → pénalise le vélo et la marche seule (aucun abri
  // dans les deux cas), prime les TC couverts
  if (weather) {
    const isWet = ['rain', 'snow', 'thunderstorm'].includes(weather.condition)
    const isWindy = weather.windSpeed > 40
    const hasBike = segments.some((s) => s.mode === 'bike')
    // 100% marche, aucun autre mode — même exposition qu'un trajet vélo, sans abri
    const isPureWalk = segments.length > 0 && segments.every((s) => s.mode === 'walk')
    // At least one covered TC segment required — walk-only does not qualify for shelter bonus
    const isPureTC = segments.some((s) => TC_MODES.includes(s.mode)) && !hasBike

    if ((isWet || isWindy) && (hasBike || isPureWalk)) base = Math.max(0, base - 30)
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
