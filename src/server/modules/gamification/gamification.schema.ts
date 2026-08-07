import { z } from 'zod'
import { TRANSPORT_MODES } from '../../../shared/types/index.js'

const segmentInputSchema = z.object({
  mode: z.enum(TRANSPORT_MODES),
  distanceKm: z.number().refine(Number.isFinite).min(0).max(200),
})

// Pas de coordonnées de départ/arrivée : elles ne servent à aucun calcul côté
// serveur et ne sont jamais persistées (minimisation RGPD, cf. migration 016).
export const recordTripSchema = z.object({
  segments: z.array(segmentInputSchema).min(1).max(20),
  // Default false: omitting the field is treated as unverified (no points)
  gpsVerified: z.boolean().default(false),
})

export type RecordTripInput = z.infer<typeof recordTripSchema>

export const getStatsQuerySchema = z.object({
  period: z.literal('month'),
})

export type GetStatsQuery = z.infer<typeof getStatsQuerySchema>
