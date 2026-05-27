import { z } from 'zod'
import { DEMO_WEATHER_MODES } from './demo-config.js'

export const demoPatchSchema = z
  .object({
    enabled: z.boolean().optional(),
    providersDemo: z.boolean().optional(),
    weather: z.enum(DEMO_WEATHER_MODES).optional(),
  })
  .strict()
  .refine(
    ({ enabled, providersDemo, weather }) =>
      enabled !== undefined || providersDemo !== undefined || weather !== undefined,
    { message: 'Au moins un champ requis : enabled, providersDemo ou weather' }
  )
