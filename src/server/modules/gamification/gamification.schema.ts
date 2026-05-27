import { z } from 'zod'
import { TRANSPORT_MODES } from '../../../shared/types/index.js'

const coordinatesSchema = z.object({
  lat: z.number().refine(Number.isFinite).min(-90).max(90),
  lng: z.number().refine(Number.isFinite).min(-180).max(180),
})

const segmentInputSchema = z.object({
  mode: z.enum(TRANSPORT_MODES),
  distanceKm: z.number().refine(Number.isFinite).min(0).max(200),
})

export const recordTripSchema = z.object({
  origin: coordinatesSchema,
  destination: coordinatesSchema,
  segments: z.array(segmentInputSchema).min(1),
})

export type RecordTripInput = z.infer<typeof recordTripSchema>
