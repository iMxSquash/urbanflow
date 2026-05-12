import type { TransportMode, UserPreference } from '../../../shared/types/index.js'

export interface MobilityProfile {
  userId: string
  preferredModes: TransportMode[]
  maxWalkMinutes: number
  preference: UserPreference
  updatedAt: string
}
