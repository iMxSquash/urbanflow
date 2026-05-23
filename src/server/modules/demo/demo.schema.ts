import { z } from 'zod'

export const demoPatchSchema = z
  .object({
    enabled: z.boolean().optional(),
    providersDemo: z.boolean().optional(),
    weather: z.enum(['sunny', 'rainy']).optional(),
  })
  .strict()
  .refine(
    ({ enabled, providersDemo, weather }) =>
      enabled !== undefined || providersDemo !== undefined || weather !== undefined,
    { message: 'Au moins un champ requis : enabled, providersDemo ou weather' }
  )
