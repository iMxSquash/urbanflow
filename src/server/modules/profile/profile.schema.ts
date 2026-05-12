import { z } from 'zod'
import { TRANSPORT_MODES, USER_PREFERENCES } from '../../../shared/types/index.js'

export const updateProfileSchema = z.object({
  preferredModes: z
    .array(z.enum(TRANSPORT_MODES))
    .min(1, { message: 'Au moins un mode de transport requis' }),
  maxWalkMinutes: z
    .number()
    .int({ message: 'Nombre entier requis' })
    .min(1, { message: 'Minimum 1 minute' })
    .max(60, { message: 'Maximum 60 minutes' }),
  preference: z.enum(USER_PREFERENCES),
})

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
