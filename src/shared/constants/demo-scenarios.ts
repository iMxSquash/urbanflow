import type { Coordinates } from '@shared/types/index.js'

// Scénarios de démo pré-configurés pour la soutenance — un trajet réel Nantes par
// scénario, indépendant de la météo simulée (choisie séparément via le panneau
// démo). `fixtureFile` est le nom du JSON dans `src/demo-data/` que DemoProvider
// sert pour ce trajet, quelle que soit la météo active.
export interface DemoScenario {
  id: string
  fromLabel: string
  toLabel: string
  from: Coordinates
  to: Coordinates
  description: string
  fixtureFile: string
}

export const DEMO_SCENARIOS = [
  {
    id: 'commerce-ile-de-nantes',
    fromLabel: 'Commerce',
    toLabel: 'Île de Nantes',
    from: { lat: 47.2134, lng: -1.5541 },
    to: { lat: 47.2005, lng: -1.554 },
    description: 'Matin',
    fixtureFile: 'journey-commerce.json',
  },
  {
    id: 'gare-faculte-sciences',
    fromLabel: 'Gare de Nantes',
    toLabel: 'Faculté des Sciences',
    from: { lat: 47.2181, lng: -1.5418 },
    to: { lat: 47.2628, lng: -1.5487 },
    description: 'Heure de pointe',
    fixtureFile: 'journey-gare.json',
  },
] as const satisfies readonly DemoScenario[]

// Tolérance de rapprochement des coordonnées pour retrouver le scénario associé
// à un trajet demandé (marge pour d'éventuels arrondis, cf. `roundCoord`).
export const SCENARIO_MATCH_TOLERANCE_KM = 0.05
