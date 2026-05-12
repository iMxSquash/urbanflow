// Types partagés front/back — ne pas importer depuis l'un ou l'autre directement

export interface Coordinates {
  lat: number
  lng: number
}

export const TRANSPORT_MODES = ['walk', 'bus', 'tramway', 'bike', 'scooter'] as const
export type TransportMode = (typeof TRANSPORT_MODES)[number]

export const USER_PREFERENCES = ['eco', 'fast', 'balanced'] as const
export type UserPreference = (typeof USER_PREFERENCES)[number]

export interface JourneyOptions {
  preference: UserPreference
  departureTime?: Date
  modes?: TransportMode[]
}

export interface JourneySegment {
  mode: TransportMode
  from: Coordinates
  to: Coordinates
  distanceKm: number
  durationMin: number
  co2g: number
  lineRef?: string
  lineName?: string
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
  updatedAt: string
}

export interface UpdateProfileInput {
  preferredModes: TransportMode[]
  maxWalkMinutes: number
  preference: UserPreference
}

export interface ApiResponse<T> {
  data: T
  meta?: Record<string, unknown>
}

export interface ApiError {
  error: string
  details?: unknown
}
