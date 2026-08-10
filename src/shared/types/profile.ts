import type { TransportMode } from './transport-mode.js'
import type { UserPreference } from './user-preference.js'

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
