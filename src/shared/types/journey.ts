import type { Coordinates } from './coordinates.js'
import type { TransportMode } from './transport-mode.js'
import type { UserPreference } from './user-preference.js'

export interface JourneyOptions {
  preference: UserPreference
  departureTime?: Date // heure de référence (départ OU arrivée selon datetimeType)
  datetimeType?: 'departure' | 'arrival' // départ à / arriver avant — défaut 'departure'
  modes?: TransportMode[] // modes autorisés — sélectionne les providers (TC→Transitous, actifs→OSRM) et filtre dur les itinéraires ; influence aussi le score confort
  maxWalkMinutes?: number // pénalité si segment marche dépasse ce seuil
  pmrAccessibility?: boolean // réduit maxWalkMinutes effectif à 5 min, pénalise le vélo
  avoidElevation?: boolean // pénalise le confort si un segment vélo est présent (pas de données DEM réelles disponibles — cf. scoring.service.ts)
}

export interface JourneySegment {
  mode: TransportMode
  from: Coordinates
  to: Coordinates
  distanceKm: number
  durationMin: number // durée du segment (déplacement effectif) ; pour les TC, hors temps d'attente à l'arrêt
  co2g: number
  lineRef?: string
  lineName?: string
  shape?: Coordinates[] // tracé réel décodé depuis legGeometry
  waitTimeMin?: number // attente à l'arrêt avant montée (TC uniquement)
  scheduledDeparture?: string // ISO — heure de départ prévue du véhicule
}

export interface Journey {
  id: string
  label: string
  segments: JourneySegment[]
  totalDurationMin: number
  totalDistanceKm: number
  totalCo2g: number
  co2SavingG: number
  score: number
  comfortScore?: number
  estimatedCostEur?: number
  departureTime?: string // ISO — heure de départ du premier leg
}
