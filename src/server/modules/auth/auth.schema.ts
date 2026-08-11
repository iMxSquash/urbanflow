import { z } from 'zod'

const passwordRule = z
  .string()
  .min(8, { message: 'Minimum 8 caractères' })
  .regex(/[A-Z]/, { message: 'Au moins une majuscule requise' })
  .regex(/[0-9]/, { message: 'Au moins un chiffre requis' })

export const registerSchema = z.object({
  email: z.email({ message: 'Format email invalide' }),
  password: passwordRule,
  termsAccepted: z.literal(true, { message: "L'acceptation des CGU est requise" }),
})

export const loginSchema = z.object({
  email: z.email({ message: 'Format email invalide' }),
  password: z.string().min(1, { message: 'Mot de passe requis' }),
  rememberMe: z.boolean().optional(),
})

export const recoverPasswordSchema = z.object({
  email: z.email({ message: 'Format email invalide' }),
  recoveryCode: z.string().min(1, { message: 'Code de récupération requis' }),
  newPassword: passwordRule,
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type RecoverPasswordInput = z.infer<typeof recoverPasswordSchema>
