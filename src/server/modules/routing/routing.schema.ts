import { z } from 'zod'
import { TRANSPORT_MODES, USER_PREFERENCES } from '@shared/types/index.js'

const coordinatesSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
})

export const journeyRequestSchema = z.object({
  from: coordinatesSchema,
  to: coordinatesSchema,
  datetime: z.string().datetime({ offset: true }).optional(),
  datetimeType: z.enum(['departure', 'arrival']).optional().default('departure'),
  preference: z.enum(USER_PREFERENCES).optional().default('balanced'),
  preferredModes: z
    .array(z.enum(TRANSPORT_MODES))
    .max(TRANSPORT_MODES.length)
    .optional()
    .default([]),
  maxWalkMinutes: z.number().min(1).max(120).optional().default(30),
  pmrAccessibility: z.boolean().optional().default(false),
})

export type JourneyRequest = z.infer<typeof journeyRequestSchema>
