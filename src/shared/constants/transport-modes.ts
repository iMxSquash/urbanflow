import type { TransportMode } from '@shared/types/index.js'

// Modes transport en commun — activent TransitousProvider, comptent pour le
// ticket Naolib (computeEstimatedCost) et le bonus confort "abri" par temps de pluie.
export const TC_TRANSPORT_MODES: TransportMode[] = ['bus', 'tramway', 'navibus', 'train']

// Modes actifs / mobilité douce — activent OsrmProvider.
export const ACTIVE_TRANSPORT_MODES: TransportMode[] = ['bike', 'walk', 'scooter']
