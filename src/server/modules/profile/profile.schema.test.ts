import { describe, it, expect } from 'vitest'
import { TRANSPORT_MODES } from '../../../shared/types/index.js'
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

  it('accepte tous les modes connus incluant navibus et train', () => {
    const result = updateProfileSchema.safeParse({
      ...valid,
      preferredModes: [...TRANSPORT_MODES],
    })
    expect(result.success).toBe(true)
  })

  it('accepte navibus seul', () => {
    expect(updateProfileSchema.safeParse({ ...valid, preferredModes: ['navibus'] }).success).toBe(
      true
    )
  })

  it('accepte train seul', () => {
    expect(updateProfileSchema.safeParse({ ...valid, preferredModes: ['train'] }).success).toBe(
      true
    )
  })

  it('rejette un tableau de modes vide', () => {
    const result = updateProfileSchema.safeParse({ ...valid, preferredModes: [] })
    expect(result.success).toBe(false)
  })

  it('rejette un mode inconnu', () => {
    const result = updateProfileSchema.safeParse({ ...valid, preferredModes: ['avion'] })
    expect(result.success).toBe(false)
  })

  it('rejette maxWalkMinutes inférieur à 5', () => {
    expect(updateProfileSchema.safeParse({ ...valid, maxWalkMinutes: 4 }).success).toBe(false)
  })

  it('accepte maxWalkMinutes à 5 (borne minimale)', () => {
    expect(updateProfileSchema.safeParse({ ...valid, maxWalkMinutes: 5 }).success).toBe(true)
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
