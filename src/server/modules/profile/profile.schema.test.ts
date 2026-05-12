import { describe, it, expect } from 'vitest'
import { updateProfileSchema } from './profile.schema.js'

const valid = {
  preferredModes: ['walk', 'tramway'],
  maxWalkMinutes: 15,
  preference: 'balanced',
  pmrAccessibility: false,
}

describe('updateProfileSchema', () => {
  it('accepte un payload complet valide', () => {
    expect(updateProfileSchema.safeParse(valid).success).toBe(true)
  })

  it('accepte tous les modes connus', () => {
    const result = updateProfileSchema.safeParse({
      ...valid,
      preferredModes: ['walk', 'bus', 'tramway', 'bike', 'scooter'],
    })
    expect(result.success).toBe(true)
  })

  it('rejette un tableau de modes vide', () => {
    const result = updateProfileSchema.safeParse({ ...valid, preferredModes: [] })
    expect(result.success).toBe(false)
  })

  it('rejette un mode inconnu', () => {
    const result = updateProfileSchema.safeParse({ ...valid, preferredModes: ['avion'] })
    expect(result.success).toBe(false)
  })

  it('rejette maxWalkMinutes à 0', () => {
    expect(updateProfileSchema.safeParse({ ...valid, maxWalkMinutes: 0 }).success).toBe(false)
  })

  it('rejette maxWalkMinutes supérieur à 60', () => {
    expect(updateProfileSchema.safeParse({ ...valid, maxWalkMinutes: 61 }).success).toBe(false)
  })

  it('rejette maxWalkMinutes décimal', () => {
    expect(updateProfileSchema.safeParse({ ...valid, maxWalkMinutes: 10.5 }).success).toBe(false)
  })

  it('rejette une préférence inconnue', () => {
    expect(updateProfileSchema.safeParse({ ...valid, preference: 'turbo' }).success).toBe(false)
  })

  it('accepte pmrAccessibility à true', () => {
    expect(updateProfileSchema.safeParse({ ...valid, pmrAccessibility: true }).success).toBe(true)
  })

  it('rejette pmrAccessibility manquant', () => {
    const { pmrAccessibility: _, ...without } = valid
    expect(updateProfileSchema.safeParse(without).success).toBe(false)
  })
})
