import type { TransportMode } from '@shared/types/index.js'

// Source : Base Empreinte ADEME — g CO2e par km (par passager pour TC)
// `satisfies` garantit à la compilation que chaque TransportMode a un facteur CO2.
// Ajouter un mode dans TRANSPORT_MODES sans l'ajouter ici → erreur TypeScript.
export const CO2_FACTORS = {
  car: 253, // g CO2e/km — référence voiture solo (calcul économie)
  bus: 109, // g CO2e/km/passager
  tramway: 4, // g CO2e/km/passager (électrique réseau Naolib)
  bike: 0, // g CO2e/km
  walk: 0, // g CO2e/km
  scooter: 0, // g CO2e/km (électrique)
  navibus: 50, // g CO2e/km/passager (ferry Loire — estimation)
  train: 14, // g CO2e/km/passager (TER électrifié — Base Empreinte ADEME)
} as const satisfies Record<TransportMode | 'car', number>

export type TransportModeKey = keyof typeof CO2_FACTORS
