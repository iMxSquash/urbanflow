/**
 * Registre central des clés de cache `resource-cache.store.ts` et de leur
 * TTL — évite qu'un site de fetch et un site d'invalidation divergent sur la
 * même clé tapée à la main sans que le compilateur ne le voie.
 */
export const CACHE_KEYS = {
  biclooStations: 'bicloo-stations',
  tanStops: 'tan-stops',
  tanLines: 'tan-lines',
  weather: 'weather',
  gamificationBadges: 'gamification-badges',
  gamificationDashboardStats: 'gamification-dashboard-stats',
  rewardsCatalog: 'rewards-catalog',
  rewardsRedemptions: 'rewards-redemptions',
  demoStatus: 'demo-status',
  profile: 'profile',
} as const

export const CACHE_TTL_MS = {
  // Quasi temps réel (remplissage des stations) — TTL court.
  biclooStations: 60 * 1000,
  // Référence quasi statique en session — TTL long.
  tanStops: 10 * 60 * 1000,
  tanLines: 10 * 60 * 1000,
  // Aligné sur le cache mémoire OpenWeather côté serveur (CLAUDE.md, 10 min).
  weather: 10 * 60 * 1000,
  gamificationBadges: 5 * 60 * 1000,
  gamificationDashboardStats: 5 * 60 * 1000,
  // Catalogue de récompenses, rarement modifié.
  rewardsCatalog: 10 * 60 * 1000,
  rewardsRedemptions: 2 * 60 * 1000,
  // Réglages démo, changés uniquement via les actions de ParametresPage —
  // invalidé explicitement à chaque mutation (toggle/météo), le TTL ne sert
  // qu'à éviter un refetch réseau redondant sur une simple navigation.
  demoStatus: 5 * 60 * 1000,
  // Profil de mobilité — changé uniquement via updateProfile (Profil ou
  // Onboarding), qui invalide explicitement à chaque mutation.
  profile: 10 * 60 * 1000,
} as const
