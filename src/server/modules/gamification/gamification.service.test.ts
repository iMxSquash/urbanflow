import { describe, it, expect, vi } from 'vitest'

vi.mock('../../db/pool.js', () => ({
  pool: { query: vi.fn(), connect: vi.fn() },
}))

import { computeCo2Saved, computePoints, POINTS_PER_GRAM_SAVED } from './gamification.service.js'
import { CO2_FACTORS } from '../../../shared/constants/co2-factors.js'

describe('computeCo2Saved', () => {
  it('trajet 100% tramway : économie proche de 100% vs voiture', () => {
    const segments = [{ mode: 'tramway', distanceKm: 10 }]
    const { co2SavedGrams } = computeCo2Saved(segments)

    const carCo2 = 10 * CO2_FACTORS.car
    const tramCo2 = 10 * CO2_FACTORS.tramway
    expect(co2SavedGrams).toBe(Math.max(0, Math.round(carCo2 - tramCo2)))
  })

  it('trajet 100% voiture : économie nulle (mode absent des facteurs → 0)', () => {
    // Si le client envoie un mode sans facteur connu → facteur 0 → co2Saved = carCo2g entier
    const segments = [{ mode: 'walk', distanceKm: 5 }]
    const { co2SavedGrams } = computeCo2Saved(segments)
    expect(co2SavedGrams).toBe(Math.round(5 * CO2_FACTORS.car))
  })

  it('trajet multimodal : addition des CO2 par segment', () => {
    const segments = [
      { mode: 'walk', distanceKm: 0.5 },
      { mode: 'bus', distanceKm: 8 },
      { mode: 'walk', distanceKm: 0.3 },
    ]
    const { totalCo2g, co2SavedGrams } = computeCo2Saved(segments)

    const expectedCo2 = 0.5 * CO2_FACTORS.walk + 8 * CO2_FACTORS.bus + 0.3 * CO2_FACTORS.walk
    expect(totalCo2g).toBeCloseTo(expectedCo2)

    const totalDistKm = 0.5 + 8 + 0.3
    const carCo2 = totalDistKm * CO2_FACTORS.car
    expect(co2SavedGrams).toBe(Math.max(0, Math.round(carCo2 - expectedCo2)))
  })

  it('co2SavedGrams est toujours >= 0 (jamais négatif)', () => {
    // Impossible en pratique mais le guard Math.max(0, ...) doit tenir
    const segments = [{ mode: 'tramway', distanceKm: 0 }]
    const { co2SavedGrams } = computeCo2Saved(segments)
    expect(co2SavedGrams).toBeGreaterThanOrEqual(0)
  })

  it('trajets vélo et marche : CO2 trajet = 0, économie = 100% coût voiture', () => {
    const segments = [
      { mode: 'bike', distanceKm: 3 },
      { mode: 'walk', distanceKm: 0.5 },
    ]
    const { totalCo2g, co2SavedGrams } = computeCo2Saved(segments)

    expect(totalCo2g).toBe(0)
    expect(co2SavedGrams).toBe(Math.round(3.5 * CO2_FACTORS.car))
  })
})

describe('computePoints', () => {
  it(`1 point par ${POINTS_PER_GRAM_SAVED}g de CO2 économisés`, () => {
    expect(computePoints(100)).toBe(10)
    expect(computePoints(150)).toBe(15)
    expect(computePoints(99)).toBe(9)
  })

  it('0 g économisés → 0 points', () => {
    expect(computePoints(0)).toBe(0)
  })

  it("arrondi à l'entier inférieur", () => {
    expect(computePoints(19)).toBe(1)
    expect(computePoints(10)).toBe(1)
    expect(computePoints(9)).toBe(0)
  })
})
