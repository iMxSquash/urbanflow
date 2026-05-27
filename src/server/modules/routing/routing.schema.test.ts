import { describe, it, expect } from 'vitest'
import { TRANSPORT_MODES, USER_PREFERENCES } from '../../../shared/types/index.js'
import { journeyRequestSchema } from './routing.schema.js'

const PT_FROM = { lat: 47.218, lng: -1.553 }
const PT_TO = { lat: 47.225, lng: -1.545 }

const MINIMAL = { from: PT_FROM, to: PT_TO }

describe('journeyRequestSchema', () => {
  it('accepte un payload minimal (from + to uniquement)', () => {
    expect(journeyRequestSchema.safeParse(MINIMAL).success).toBe(true)
  })

  it('accepte tous les modes incluant navibus et train', () => {
    const result = journeyRequestSchema.safeParse({
      ...MINIMAL,
      preferredModes: [...TRANSPORT_MODES],
    })
    expect(result.success).toBe(true)
  })

  it('rejette un mode inconnu dans preferredModes', () => {
    const result = journeyRequestSchema.safeParse({
      ...MINIMAL,
      preferredModes: ['avion'],
    })
    expect(result.success).toBe(false)
  })

  it('preferredModes par défaut est un tableau vide', () => {
    const result = journeyRequestSchema.safeParse(MINIMAL)
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.preferredModes).toEqual([])
  })

  it('preference par défaut est balanced', () => {
    const result = journeyRequestSchema.safeParse(MINIMAL)
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.preference).toBe('balanced')
  })

  it('maxWalkMinutes par défaut est 30', () => {
    const result = journeyRequestSchema.safeParse(MINIMAL)
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.maxWalkMinutes).toBe(30)
  })

  it('pmrAccessibility par défaut est false', () => {
    const result = journeyRequestSchema.safeParse(MINIMAL)
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.pmrAccessibility).toBe(false)
  })

  it('accepte pmrAccessibility à true', () => {
    const result = journeyRequestSchema.safeParse({ ...MINIMAL, pmrAccessibility: true })
    expect(result.success).toBe(true)
  })

  it('rejette une preference inconnue', () => {
    expect(journeyRequestSchema.safeParse({ ...MINIMAL, preference: 'turbo' }).success).toBe(false)
  })

  it('accepte les trois préférences valides', () => {
    for (const pref of USER_PREFERENCES) {
      expect(journeyRequestSchema.safeParse({ ...MINIMAL, preference: pref }).success).toBe(true)
    }
  })

  it('rejette lat hors bornes (< −90)', () => {
    expect(journeyRequestSchema.safeParse({ from: { lat: -91, lng: 0 }, to: PT_TO }).success).toBe(
      false
    )
  })

  it('rejette lat hors bornes (> 90)', () => {
    expect(journeyRequestSchema.safeParse({ from: { lat: 91, lng: 0 }, to: PT_TO }).success).toBe(
      false
    )
  })

  it('rejette lng hors bornes (< −180)', () => {
    expect(journeyRequestSchema.safeParse({ from: { lat: 0, lng: -181 }, to: PT_TO }).success).toBe(
      false
    )
  })

  it('rejette lng hors bornes (> 180)', () => {
    expect(
      journeyRequestSchema.safeParse({ from: PT_FROM, to: { lat: 0, lng: 181 } }).success
    ).toBe(false)
  })

  it('accepte maxWalkMinutes à la borne minimale (1)', () => {
    expect(journeyRequestSchema.safeParse({ ...MINIMAL, maxWalkMinutes: 1 }).success).toBe(true)
  })

  it('rejette maxWalkMinutes = 0', () => {
    expect(journeyRequestSchema.safeParse({ ...MINIMAL, maxWalkMinutes: 0 }).success).toBe(false)
  })

  it('accepte maxWalkMinutes à la borne maximale (120)', () => {
    expect(journeyRequestSchema.safeParse({ ...MINIMAL, maxWalkMinutes: 120 }).success).toBe(true)
  })

  it('rejette maxWalkMinutes = 121', () => {
    expect(journeyRequestSchema.safeParse({ ...MINIMAL, maxWalkMinutes: 121 }).success).toBe(false)
  })

  it('accepte datetime au format ISO 8601 avec offset', () => {
    const result = journeyRequestSchema.safeParse({
      ...MINIMAL,
      datetime: '2026-09-15T09:00:00+02:00',
    })
    expect(result.success).toBe(true)
  })

  it('rejette datetime sans offset timezone', () => {
    const result = journeyRequestSchema.safeParse({
      ...MINIMAL,
      datetime: '2026-09-15T09:00:00',
    })
    expect(result.success).toBe(false)
  })
})
