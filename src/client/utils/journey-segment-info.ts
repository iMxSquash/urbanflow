import { CO2_FACTORS } from '@shared/constants/co2-factors'
import type { TransportMode } from '@shared/types/index'

// Intervalles typiques entre passages (minutes) — estimation sans SIRI-Lite
// (temps réel non encore intégré, cf. CLAUDE.md § APIs externes).
const TC_HEADWAY: Partial<Record<TransportMode, number>> = {
  tramway: 7,
  bus: 12,
  navibus: 20,
  train: 30,
}

// Calories estimées par minute selon le mode
const CALORIES_PER_MIN: Partial<Record<TransportMode, number>> = {
  walk: 5,
  bike: 8,
  scooter: 1,
}

export function avgSpeedKmh(distKm: number, durationMin: number): number {
  if (durationMin === 0 || distKm === 0) return 0
  return Math.round((distKm / (durationMin / 60)) * 10) / 10
}

/** Horaires de passage suivants — estimation par intervalle typique, jamais du
 * temps réel : affichés comme "estimés" à côté de l'horaire prévu. */
export function estimatedNextDepartures(mode: TransportMode, scheduled: string): string[] {
  const headway = TC_HEADWAY[mode] ?? 12
  const base = new Date(scheduled).getTime()
  return [1, 2].map((i) => new Date(base + i * headway * 60_000).toISOString())
}

export function caloriesBurned(mode: TransportMode, durationMin: number): number | undefined {
  const perMin = CALORIES_PER_MIN[mode]
  return perMin ? Math.round(perMin * durationMin) : undefined
}

/** CO2 économisé par ce segment vs le même trajet en voiture (Base Empreinte ADEME). */
export function co2SavedVsCarG(distanceKm: number, co2g: number): number {
  if (distanceKm <= 0) return 0
  return Math.max(0, Math.round(distanceKm * CO2_FACTORS.car) - co2g)
}
