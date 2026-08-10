import type { UserPreference } from '@shared/types/index.js'

export interface ScoringWeights {
  duration: number
  co2: number
  comfort: number
}

// Source de vérité unique des pondérations du moteur de scoring (CLAUDE.md §
// "Scoring itinéraire"). Consommé par `scoring.service.ts` (calcul réel) et
// `ProfilePage.tsx` (affichage informatif) pour éviter toute désynchronisation.
export const SCORING_WEIGHTS: Record<UserPreference, ScoringWeights> = {
  eco: { duration: 0.2, co2: 0.7, comfort: 0.1 },
  fast: { duration: 0.7, co2: 0.2, comfort: 0.1 },
  balanced: { duration: 0.4, co2: 0.5, comfort: 0.1 },
}
