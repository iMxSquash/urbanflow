import { describe, it, expect } from 'vitest'
import { CO2_FACTORS } from './co2-factors.js'

describe('CO2_FACTORS', () => {
  it('la voiture est le mode le plus émetteur', () => {
    const nonCarValues = Object.entries(CO2_FACTORS)
      .filter(([mode]) => mode !== 'car')
      .map(([, value]) => value as number)

    expect(nonCarValues.every((v) => v < CO2_FACTORS.car)).toBe(true)
  })

  it('les modes décarbonés émettent 0 gCO2e/km', () => {
    expect(CO2_FACTORS.bike).toBe(0)
    expect(CO2_FACTORS.walk).toBe(0)
    expect(CO2_FACTORS.scooter).toBe(0)
  })

  it('le tramway émet moins que le bus (électrique vs thermique)', () => {
    expect(CO2_FACTORS.tramway).toBeLessThan(CO2_FACTORS.bus)
  })

  it('les valeurs correspondent aux facteurs ADEME documentés', () => {
    expect(CO2_FACTORS.car).toBe(253)
    expect(CO2_FACTORS.bus).toBe(109)
    expect(CO2_FACTORS.tramway).toBe(4)
  })
})
