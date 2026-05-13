import { z } from 'zod'

const coordinatesSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
})

export const journeyRequestSchema = z.object({
  from: coordinatesSchema,
  to: coordinatesSchema,
  datetime: z.string().datetime({ offset: true }).optional(),
})

export type JourneyRequest = z.infer<typeof journeyRequestSchema>
