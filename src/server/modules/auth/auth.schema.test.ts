import { describe, it, expect } from 'vitest'
import { registerSchema, loginSchema } from './auth.schema.js'

describe('registerSchema', () => {
  const valid = { email: 'alice@nantes.fr', password: 'Password1' }

  it('accepte un email et un mot de passe valides', () => {
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
