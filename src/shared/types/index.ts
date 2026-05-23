// Types partagés front/back — ne pas importer depuis l'un ou l'autre directement

export interface Coordinates {
  lat: number
  lng: number
}

export const TRANSPORT_MODES = [
  'walk',
  'bus',
  'tramway',
  'bike',
  'scooter',
  'navibus',
  'train',
] as const
export type TransportMode = (typeof TRANSPORT_MODES)[number]

export const USER_PREFERENCES = ['eco', 'fast', 'balanced'] as const
export type UserPreference = (typeof USER_PREFERENCES)[number]

export interface JourneyOptions {
  preference: UserPreference
  departureTime?: Date
  modes?: TransportMode[] // modes autorisés — sélectionne les providers (TC→Transitous, actifs→OSRM) et filtre dur les itinéraires ; influence aussi le score confort
  maxWalkMinutes?: number // pénalité si segment marche dépasse ce seuil
  pmrAccessibility?: boolean // réduit maxWalkMinutes effectif à 5 min, pénalise le vélo
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

export interface WeatherCondition {
  city: string
  condition: 'clear' | 'rain' | 'snow' | 'clouds' | 'thunderstorm'
  temperature: number
  humidity: number
  windSpeed: number
  description: string
  icon: string
  timestamp: string
}

export interface BiclooStation {
  id: string
  name: string
  coordinates: Coordinates
  availableBikes: number
  availableDocks: number
  totalDocks: number
}

export interface Departure {
  lineRef: string
  lineName: string
  destination: string
  expectedDeparture: string
  realtimeAvailable: boolean
}

export interface StopDepartures {
  stopRef: string
  stopName: string
  departures: Departure[]
}

export interface MobilityProfile {
  userId: string
  preferredModes: TransportMode[]
  maxWalkMinutes: number
  preference: UserPreference
  pmrAccessibility: boolean
  updatedAt: string
}

export interface UpdateProfileInput {
  preferredModes: TransportMode[]
  maxWalkMinutes: number
  preference: UserPreference
  pmrAccessibility: boolean
}

export interface TanLine {
  routeId: string
  shortName: string
  longName: string
  routeType: string
  color: string // hex sans #, ex: "E30613"
  coordinates: [number, number][][] // MultiLineString
}

export interface TanStop {
  stopId: string
  name: string
  coordinates: Coordinates
  wheelchairBoarding: boolean
}

export interface ApiResponse<T> {
  data: T
  meta?: Record<string, unknown>
}

export interface ApiError {
  error: string
  details?: unknown
}
