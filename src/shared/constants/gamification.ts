// Source de vérité unique — consommé par `gamification.service.ts` (calcul réel
// des points) et `TripToast.tsx` (points potentiels affichés quand le trajet
// n'est pas suivi par GPS), pour éviter toute désynchronisation.
export const GRAMS_PER_POINT = 10
