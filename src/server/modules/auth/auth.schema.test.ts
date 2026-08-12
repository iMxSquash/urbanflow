import { describe, it, expect } from 'vitest'
import { registerSchema, loginSchema, recoverPasswordSchema } from './auth.schema.js'

describe('registerSchema', () => {
  const valid = { email: 'alice@nantes.fr', password: 'Password1', termsAccepted: true }

  it('accepte un email, un mot de passe valides et les CGU acceptées', () => {
    expect(registerSchema.safeParse(valid).success).toBe(true)
  })

  it('rejette un email mal formé', () => {
    const result = registerSchema.safeParse({ ...valid, email: 'pas-un-email' })
    expect(result.success).toBe(false)
  })

  it('rejette un mot de passe de moins de 8 caractères', () => {
    const result = registerSchema.safeParse({ ...valid, password: 'Short1' })
    expect(result.success).toBe(false)
  })

  it('rejette un mot de passe sans majuscule', () => {
    const result = registerSchema.safeParse({ ...valid, password: 'password1' })
    expect(result.success).toBe(false)
  })

  it('rejette un mot de passe sans chiffre', () => {
    const result = registerSchema.safeParse({ ...valid, password: 'PasswordOnly' })
    expect(result.success).toBe(false)
  })

  it('rejette un corps vide', () => {
    expect(registerSchema.safeParse({}).success).toBe(false)
  })

  it('rejette les CGU non acceptées', () => {
    expect(registerSchema.safeParse({ ...valid, termsAccepted: false }).success).toBe(false)
  })

  it('rejette termsAccepted manquant', () => {
    const { termsAccepted: _, ...withoutTerms } = valid
    expect(registerSchema.safeParse(withoutTerms).success).toBe(false)
  })
})

describe('loginSchema', () => {
  const valid = { email: 'alice@nantes.fr', password: 'anypassword' }

  it('accepte un email et un mot de passe valides', () => {
    expect(loginSchema.safeParse(valid).success).toBe(true)
  })

  it('rejette un email mal formé', () => {
    const result = loginSchema.safeParse({ ...valid, email: 'mauvais' })
    expect(result.success).toBe(false)
  })

  it('rejette un mot de passe vide', () => {
    const result = loginSchema.safeParse({ ...valid, password: '' })
    expect(result.success).toBe(false)
  })
})

describe('recoverPasswordSchema', () => {
  const valid = {
    email: 'alice@nantes.fr',
    recoveryCode: 'ABCD-EFGH-JKMN-PQRS',
    newPassword: 'Password1',
  }

  it('accepte un email, un code et un nouveau mot de passe valides', () => {
    expect(recoverPasswordSchema.safeParse(valid).success).toBe(true)
  })

  it('rejette un email mal formé', () => {
    const result = recoverPasswordSchema.safeParse({ ...valid, email: 'mauvais' })
    expect(result.success).toBe(false)
  })

  it('rejette un code de récupération vide', () => {
    const result = recoverPasswordSchema.safeParse({ ...valid, recoveryCode: '' })
    expect(result.success).toBe(false)
  })

  it('rejette un nouveau mot de passe qui ne respecte pas la règle commune', () => {
    const result = recoverPasswordSchema.safeParse({ ...valid, newPassword: 'short' })
    expect(result.success).toBe(false)
  })
})
