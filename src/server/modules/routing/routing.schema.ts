import { z } from 'zod'

const coordinatesSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
})

export const journeyRequestSchema = z.object({
  from: coordinatesSchema,
  to: coordinatesSchema,
  datetime: z.string().datetime({ offset: true }).optional(),
  preference: z.enum(['eco', 'fast', 'balanced']).optional().default('balanced'),
  preferredModes: z
    .array(z.enum(['walk', 'bus', 'tramway', 'bike', 'scooter']))
    .optional()
    .default([]),
  maxWalkMinutes: z.number().min(1).max(120).optional().default(30),
  pmrAccessibility: z.boolean().optional().default(false),
})

export type JourneyRequest = z.infer<typeof journeyRequestSchema>
