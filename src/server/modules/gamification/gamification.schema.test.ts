import { describe, it, expect } from 'vitest'
import { recordTripSchema } from './gamification.schema.js'

const VALID_SEGMENT = { mode: 'tramway', distanceKm: 5 }
const VALID_COORDS = { lat: 47.218, lng: -1.553 }

const VALID = {
  origin: VALID_COORDS,
  destination: { lat: 47.225, lng: -1.56 },
  segments: [VALID_SEGMENT],
}

describe('recordTripSchema', () => {
  // ── Cas valides ──────────────────────────────────────────────────────────────

  it('accepte un payload complet valide', () => {
    expect(recordTripSchema.safeParse(VALID).success).toBe(true)
  })

  it('accepte tous les modes de transport connus', () => {
    const modes = ['walk', 'bus', 'tramway', 'bike', 'scooter', 'navibus', 'train'] as const
    for (const mode of modes) {
      const result = recordTripSchema.safeParse({ ...VALID, segments: [{ mode, distanceKm: 1 }] })
      expect(result.success, `mode ${mode} devrait être accepté`).toBe(true)
    }
  })

  it('accepte plusieurs segments dans un trajet multimodal', () => {
    const result = recordTripSchema.safeParse({
      ...VALID,
      segments: [
        { mode: 'walk', distanceKm: 0.3 },
        { mode: 'tramway', distanceKm: 8 },
        { mode: 'walk', distanceKm: 0.2 },
      ],
    })
    expect(result.success).toBe(true)
  })

  it('accepte distanceKm = 0 (segment de longueur nulle)', () => {
    const result = recordTripSchema.safeParse({
      ...VALID,
      segments: [{ mode: 'walk', distanceKm: 0 }],
    })
    expect(result.success).toBe(true)
  })

  it('accepte les coordonnées aux limites exactes (lat ±90, lng ±180)', () => {
    expect(recordTripSchema.safeParse({
      ...VALID,
      origin: { lat: 90, lng: 180 },
      destination: { lat: -90, lng: -180 },
    }).success).toBe(true)
  })

  // ── Segments ─────────────────────────────────────────────────────────────────

  it('rejette un tableau de segments vide (minItems: 1)', () => {
    expect(recordTripSchema.safeParse({ ...VALID, segments: [] }).success).toBe(false)
  })

  it('rejette un mode inconnu', () => {
    const result = recordTripSchema.safeParse({
      ...VALID,
      segments: [{ mode: 'avion', distanceKm: 10 }],
    })
    expect(result.success).toBe(false)
  })

  it('rejette une distance négative', () => {
    const result = recordTripSchema.safeParse({
      ...VALID,
      segments: [{ mode: 'walk', distanceKm: -1 }],
    })
    expect(result.success).toBe(false)
  })

  it('rejette un segment sans mode', () => {
    const result = recordTripSchema.safeParse({
      ...VALID,
      segments: [{ distanceKm: 5 }],
    })
    expect(result.success).toBe(false)
  })

  it('rejette un segment sans distanceKm', () => {
    const result = recordTripSchema.safeParse({
      ...VALID,
      segments: [{ mode: 'walk' }],
    })
    expect(result.success).toBe(false)
  })

  // ── Coordonnées ───────────────────────────────────────────────────────────────

  it('rejette NaN comme coordonnée', () => {
    expect(recordTripSchema.safeParse({ ...VALID, origin: { lat: NaN, lng: 0 } }).success).toBe(false)
  })

  it('rejette Infinity comme coordonnée', () => {
    expect(recordTripSchema.safeParse({ ...VALID, origin: { lat: Infinity, lng: 0 } }).success).toBe(false)
  })

  it('rejette NaN comme distanceKm', () => {
    expect(recordTripSchema.safeParse({ ...VALID, segments: [{ mode: 'walk', distanceKm: NaN }] }).success).toBe(false)
  })

  it('rejette Infinity comme distanceKm', () => {
    expect(recordTripSchema.safeParse({ ...VALID, segments: [{ mode: 'walk', distanceKm: Infinity }] }).success).toBe(false)
  })

  it('rejette lat > 90', () => {
    expect(recordTripSchema.safeParse({ ...VALID, origin: { lat: 91, lng: 0 } }).success).toBe(false)
  })

  it('rejette lat < -90', () => {
    expect(recordTripSchema.safeParse({ ...VALID, origin: { lat: -91, lng: 0 } }).success).toBe(false)
  })

  it('rejette lng > 180', () => {
    expect(recordTripSchema.safeParse({ ...VALID, origin: { lat: 0, lng: 181 } }).success).toBe(false)
  })

  it('rejette lng < -180', () => {
    expect(recordTripSchema.safeParse({ ...VALID, origin: { lat: 0, lng: -181 } }).success).toBe(false)
  })

  it('rejette origin manquant', () => {
    const { origin: _, ...withoutOrigin } = VALID
    expect(recordTripSchema.safeParse(withoutOrigin).success).toBe(false)
  })

  it('rejette destination manquant', () => {
    const { destination: _, ...withoutDestination } = VALID
    expect(recordTripSchema.safeParse(withoutDestination).success).toBe(false)
  })

  it('rejette un payload vide', () => {
    expect(recordTripSchema.safeParse({}).success).toBe(false)
  })
})
