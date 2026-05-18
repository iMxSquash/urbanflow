import { describe, it, expect } from 'vitest'
import type {
  JourneySegment,
  JourneyOptions,
  WeatherCondition,
} from '../../../shared/types/index.js'
import { CO2_FACTORS } from '../../../shared/constants/co2-factors.js'
import {
  scoringWeights,
  computeComfortScore,
  computeScore,
  computeEstimatedCost,
  NAOLIB_TICKET_EUR,
} from './scoring.service.js'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PT_A = { lat: 47.218, lng: -1.553 }
const PT_B = { lat: 47.225, lng: -1.545 }

function seg(
  mode: JourneySegment['mode'],
  distanceKm: number,
  durationMin: number
): JourneySegment {
  return {
    mode,
    from: PT_A,
    to: PT_B,
    distanceKm,
    durationMin,
    co2g: Math.round(distanceKm * CO2_FACTORS[mode]),
  }
}

const BASE_OPTIONS: JourneyOptions = { preference: 'balanced' }

function weather(condition: WeatherCondition['condition'], windSpeed = 10): WeatherCondition {
  return {
    city: 'Nantes',
    condition,
    temperature: 15,
    humidity: 70,
    windSpeed,
    description: '',
    icon: '',
    timestamp: '2026-05-18T10:00:00Z',
  }
}

// ─── scoringWeights ───────────────────────────────────────────────────────────

describe('scoringWeights', () => {
  it('eco : co2 prioritaire (0.7)', () => {
    const w = scoringWeights('eco')
    expect(w).toEqual({ duration: 0.2, co2: 0.7, comfort: 0.1 })
  })

  it('fast : durée prioritaire (0.7)', () => {
    const w = scoringWeights('fast')
    expect(w).toEqual({ duration: 0.7, co2: 0.2, comfort: 0.1 })
  })

  it('balanced : co2 important (0.5) durée modérée (0.4)', () => {
    const w = scoringWeights('balanced')
    expect(w).toEqual({ duration: 0.4, co2: 0.5, comfort: 0.1 })
  })

  it('la somme des poids vaut 1.0 pour chaque préférence', () => {
    for (const pref of ['eco', 'fast', 'balanced'] as const) {
      const w = scoringWeights(pref)
      expect(w.duration + w.co2 + w.comfort).toBeCloseTo(1.0)
    }
  })

  it('eco : durée poids inférieur au poids CO2', () => {
    const w = scoringWeights('eco')
    expect(w.duration).toBeLessThan(w.co2)
  })

  it('fast : poids durée supérieur au poids CO2', () => {
    const w = scoringWeights('fast')
    expect(w.duration).toBeGreaterThan(w.co2)
  })
})

// ─── computeComfortScore ──────────────────────────────────────────────────────

describe('computeComfortScore', () => {
  it('sans modes préférés → base 50', () => {
    const segments = [seg('bus', 3, 15)]
    expect(computeComfortScore(segments, BASE_OPTIONS)).toBe(50)
  })

  it('tous les segments correspondent aux modes préférés → 100', () => {
    const segments = [seg('bus', 3, 15), seg('tramway', 2, 10)]
    const options: JourneyOptions = { preference: 'balanced', modes: ['bus', 'tramway'] }
    expect(computeComfortScore(segments, options)).toBe(100)
  })

  it('aucun segment ne correspond aux modes préférés → 0', () => {
    const segments = [seg('bus', 3, 15)]
    const options: JourneyOptions = { preference: 'balanced', modes: ['bike'] }
    expect(computeComfortScore(segments, options)).toBe(0)
  })

  it('1 segment sur 2 correspond → 50', () => {
    const segments = [seg('bus', 2, 10), seg('bike', 3, 12)]
    const options: JourneyOptions = { preference: 'balanced', modes: ['bus'] }
    expect(computeComfortScore(segments, options)).toBe(50)
  })

  it('marche dans la limite maxWalkMinutes → pas de pénalité', () => {
    const segments = [seg('walk', 1, 10), seg('bus', 3, 15)]
    const options: JourneyOptions = {
      preference: 'balanced',
      modes: ['walk', 'bus'],
      maxWalkMinutes: 15,
    }
    const score = computeComfortScore(segments, options)
    expect(score).toBe(100)
  })

  it('marche dépassant maxWalkMinutes sans PMR → pénalité −40', () => {
    const segments = [seg('walk', 2, 25), seg('bus', 3, 15)]
    const options: JourneyOptions = {
      preference: 'balanced',
      modes: ['walk', 'bus'],
      maxWalkMinutes: 20,
    }
    const base = 100
    expect(computeComfortScore(segments, options)).toBe(base - 40)
  })

  it('PMR : marche dépassant 5 min → pénalité −60 (plus sévère)', () => {
    const segments = [seg('walk', 1, 8), seg('bus', 3, 15)]
    const options: JourneyOptions = {
      preference: 'balanced',
      modes: ['walk', 'bus'],
      maxWalkMinutes: 20,
      pmrAccessibility: true,
    }
    const base = 100
    expect(computeComfortScore(segments, options)).toBe(base - 60)
  })

  it('PMR : marche ≤ 5 min → aucune pénalité PMR', () => {
    const segments = [seg('walk', 0.3, 4), seg('bus', 3, 15)]
    const options: JourneyOptions = {
      preference: 'balanced',
      modes: ['walk', 'bus'],
      maxWalkMinutes: 20,
      pmrAccessibility: true,
    }
    expect(computeComfortScore(segments, options)).toBe(100)
  })

  it('PMR : présence de vélo → pénalité supplémentaire −50', () => {
    const segments = [seg('bike', 3, 12)]
    const options: JourneyOptions = {
      preference: 'balanced',
      modes: ['bike'],
      pmrAccessibility: true,
    }
    // base=100, pas de dépassement de marche, mais vélo → −50
    expect(computeComfortScore(segments, options)).toBe(50)
  })

  describe('météo — pénalités vélo', () => {
    it('pluie + vélo → −30 sur la base', () => {
      const segments = [seg('bike', 3, 12)]
      const options: JourneyOptions = { preference: 'balanced', modes: ['bike'] }
      // base = 100 (tout le trajet vélo correspond au mode préféré)
      expect(computeComfortScore(segments, options, weather('rain'))).toBe(70)
    })

    it('neige + vélo → −30', () => {
      const segments = [seg('bike', 3, 12)]
      const options: JourneyOptions = { preference: 'balanced', modes: ['bike'] }
      expect(computeComfortScore(segments, options, weather('snow'))).toBe(70)
    })

    it('orage + vélo → −30', () => {
      const segments = [seg('bike', 3, 12)]
      const options: JourneyOptions = { preference: 'balanced', modes: ['bike'] }
      expect(computeComfortScore(segments, options, weather('thunderstorm'))).toBe(70)
    })

    it('vent > 40 km/h + vélo → −30 (même sans pluie)', () => {
      const segments = [seg('bike', 3, 12)]
      const options: JourneyOptions = { preference: 'balanced', modes: ['bike'] }
      expect(computeComfortScore(segments, options, weather('clear', 50))).toBe(70)
    })

    it('ciel dégagé + vent ≤ 40 km/h + vélo → aucune pénalité météo', () => {
      const segments = [seg('bike', 3, 12)]
      const options: JourneyOptions = { preference: 'balanced', modes: ['bike'] }
      expect(computeComfortScore(segments, options, weather('clear', 30))).toBe(100)
    })

    it('pluie + vent fort + vélo → −30 seulement (pénalité non cumulée)', () => {
      const segments = [seg('bike', 3, 12)]
      const options: JourneyOptions = { preference: 'balanced', modes: ['bike'] }
      expect(computeComfortScore(segments, options, weather('rain', 50))).toBe(70)
    })

    it('pluie sans vélo (bus seul) → aucune pénalité vélo', () => {
      const segments = [seg('bus', 3, 15)]
      expect(computeComfortScore(segments, BASE_OPTIONS, weather('rain'))).not.toBeLessThan(50)
    })
  })

  describe('météo — bonus TC couvert', () => {
    it('pluie + TC seul → +10 sur la base', () => {
      // BASE_OPTIONS sans modes préférés → base = 50 ; +10 → 60
      const segments = [seg('bus', 3, 15)]
      expect(computeComfortScore(segments, BASE_OPTIONS, weather('rain'))).toBe(60)
    })

    it('pluie + TC + marche → +10 (marche dans la limite, isPureTC vrai)', () => {
      const segments = [seg('walk', 0.5, 5), seg('tramway', 4, 20)]
      expect(computeComfortScore(segments, BASE_OPTIONS, weather('rain'))).toBe(60)
    })

    it('pluie + TC + vélo → pénalité vélo −30, pas de bonus TC', () => {
      // base = 50, hasBike = true → −30 = 20 ; isPureTC = false → pas de +10
      const segments = [seg('bus', 2, 10), seg('bike', 3, 12)]
      expect(computeComfortScore(segments, BASE_OPTIONS, weather('rain'))).toBe(20)
    })

    it('ciel dégagé + TC seul → aucun bonus (pas de pluie)', () => {
      const segments = [seg('bus', 3, 15)]
      expect(computeComfortScore(segments, BASE_OPTIONS, weather('clear'))).toBe(50)
    })

    it('pluie + marche seule → aucun bonus (pas de TC couvert)', () => {
      // Walk-only ne doit pas bénéficier du bonus abri TC
      const segments = [seg('walk', 1, 12)]
      expect(computeComfortScore(segments, BASE_OPTIONS, weather('rain'))).toBe(50)
    })
  })

  describe('météo — cas limites', () => {
    it('weather null → comportement identique sans météo', () => {
      const segments = [seg('bike', 3, 12)]
      const options: JourneyOptions = { preference: 'balanced', modes: ['bike'] }
      expect(computeComfortScore(segments, options, null)).toBe(
        computeComfortScore(segments, options)
      )
    })

    it('weather undefined → comportement identique sans météo', () => {
      const segments = [seg('bus', 3, 15)]
      expect(computeComfortScore(segments, BASE_OPTIONS, undefined)).toBe(
        computeComfortScore(segments, BASE_OPTIONS)
      )
    })

    it('pluie + vélo + PMR → pénalités cumulées, plancher à 0', () => {
      // base = 100 (bike = mode préféré), PMR + bike → −50 = 50, pluie + bike → −30 = 20
      const segments = [seg('bike', 3, 12)]
      const options: JourneyOptions = {
        preference: 'balanced',
        modes: ['bike'],
        pmrAccessibility: true,
      }
      expect(computeComfortScore(segments, options, weather('rain'))).toBe(20)
    })

    it('bonus TC ne dépasse pas 100', () => {
      // base déjà à 100 (tous modes TC préférés) → +10 plafonné à 100
      const segments = [seg('tramway', 4, 20)]
      const options: JourneyOptions = { preference: 'balanced', modes: ['tramway'] }
      expect(computeComfortScore(segments, options, weather('rain'))).toBe(100)
    })
  })

  it('PMR + marche longue + vélo → plancher à 0', () => {
    const segments = [seg('walk', 1, 10), seg('bike', 3, 12)]
    const options: JourneyOptions = {
      preference: 'balanced',
      modes: ['walk', 'bike'],
      maxWalkMinutes: 20,
      pmrAccessibility: true,
    }
    // base=100, walk>5min → −60 → 40, bike → −50 → −10, plancher à 0
    expect(computeComfortScore(segments, options)).toBe(0)
  })
})

// ─── computeEstimatedCost ─────────────────────────────────────────────────────

describe('computeEstimatedCost', () => {
  describe('modes TC → tarif Naolib', () => {
    it('bus seul → 1.70 €', () => {
      expect(computeEstimatedCost([seg('bus', 3, 15)])).toBe(NAOLIB_TICKET_EUR)
    })

    it('tramway seul → 1.70 €', () => {
      expect(computeEstimatedCost([seg('tramway', 4, 20)])).toBe(NAOLIB_TICKET_EUR)
    })

    it('train seul → 1.70 €', () => {
      expect(computeEstimatedCost([seg('train', 10, 25)])).toBe(NAOLIB_TICKET_EUR)
    })

    it('navibus seul → 1.70 €', () => {
      expect(computeEstimatedCost([seg('navibus', 2, 10)])).toBe(NAOLIB_TICKET_EUR)
    })

    it('bus + marche → 1.70 € (ticket plat quel que soit le nombre de segments)', () => {
      expect(computeEstimatedCost([seg('walk', 0.5, 6), seg('bus', 3, 15)])).toBe(NAOLIB_TICKET_EUR)
    })

    it('plusieurs modes TC → toujours 1.70 € (un seul ticket)', () => {
      expect(computeEstimatedCost([seg('tramway', 3, 15), seg('bus', 2, 10)])).toBe(
        NAOLIB_TICKET_EUR
      )
    })
  })

  describe('modes actifs seuls → gratuit', () => {
    it('marche seule → 0 €', () => {
      expect(computeEstimatedCost([seg('walk', 1, 12)])).toBe(0)
    })

    it('vélo seul → 0 €', () => {
      expect(computeEstimatedCost([seg('bike', 5, 20)])).toBe(0)
    })

    it('trottinette seule → 0 €', () => {
      expect(computeEstimatedCost([seg('scooter', 3, 9)])).toBe(0)
    })

    it('vélo + marche → 0 € (aucun TC)', () => {
      expect(computeEstimatedCost([seg('bike', 4, 16), seg('walk', 0.5, 6)])).toBe(0)
    })
  })

  it('NAOLIB_TICKET_EUR vaut 1.70', () => {
    expect(NAOLIB_TICKET_EUR).toBe(1.7)
  })
})

// ─── computeScore ─────────────────────────────────────────────────────────────

describe('computeScore', () => {
  it('trajet instantané (0 min) → durationScore = 100', () => {
    const segments = [seg('bike', 5, 0)]
    const score = computeScore(segments, 0, 5, 0, BASE_OPTIONS)
    // balanced: 0.4 * 100 + 0.5 * 100 + 0.1 * 50 = 95
    expect(score).toBe(95)
  })

  it('trajet de 120 min → durationScore = 0', () => {
    const segments = [seg('bus', 5, 120)]
    // totalCo2g = 5 * 109 = 545, maxCo2 = 5 * 253 = 1265
    // co2Score = (1 - 545/1265) * 100 ≈ 56.9
    // comfort = 50 (no modes)
    // balanced: 0.4 * 0 + 0.5 * 56.9 + 0.1 * 50 ≈ 33
    const score = computeScore(segments, 120, 5, 5 * 109, BASE_OPTIONS)
    expect(score).toBeGreaterThanOrEqual(0)
    expect(score).toBeLessThanOrEqual(40)
  })

  it('trajet vélo (CO2 = 0) → co2Score = 100', () => {
    const segments = [seg('bike', 5, 20)]
    const score = computeScore(segments, 20, 5, 0, { preference: 'eco' })
    // eco: 0.2 * durationScore + 0.7 * 100 + 0.1 * 50
    // durationScore = max(0, 100 - (20/120)*100) ≈ 83.3
    // 0.2 * 83.3 + 0.7 * 100 + 0.1 * 50 = 16.7 + 70 + 5 = 91.7 → 92
    expect(score).toBeGreaterThanOrEqual(85)
  })

  it('CO2 équivalent voiture → co2Score = 0', () => {
    const distKm = 10
    const carCo2 = distKm * CO2_FACTORS.car
    const segments = [seg('bus', distKm, 30)]
    const score = computeScore(segments, 30, distKm, carCo2, { preference: 'eco' })
    // co2Score = 0
    // eco: 0.2 * durationScore + 0.7 * 0 + 0.1 * 50
    expect(score).toBeLessThan(30)
  })

  it('préférence eco : score influencé par CO2 plus que durée', () => {
    const fastHighCo2Segs = [seg('bus', 5, 10)]
    const slowLowCo2Segs = [seg('bike', 5, 60)]

    const scoreEcoFast = computeScore(fastHighCo2Segs, 10, 5, 5 * 109, { preference: 'eco' })
    const scoreEcoSlow = computeScore(slowLowCo2Segs, 60, 5, 0, { preference: 'eco' })

    expect(scoreEcoSlow).toBeGreaterThan(scoreEcoFast)
  })

  it('préférence fast : score influencé par durée plus que CO2', () => {
    const fastHighCo2Segs = [seg('bus', 5, 10)]
    const slowLowCo2Segs = [seg('bike', 5, 60)]

    const scoreFastFast = computeScore(fastHighCo2Segs, 10, 5, 5 * 109, { preference: 'fast' })
    const scoreFastSlow = computeScore(slowLowCo2Segs, 60, 5, 0, { preference: 'fast' })

    expect(scoreFastFast).toBeGreaterThan(scoreFastSlow)
  })

  it('le score est un entier (arrondi)', () => {
    const segments = [seg('bus', 3, 25)]
    const score = computeScore(segments, 25, 3, 3 * 109, BASE_OPTIONS)
    expect(Number.isInteger(score)).toBe(true)
  })

  it('le score est toujours dans [0, 100]', () => {
    const cases: [JourneySegment[], number, number, number, JourneyOptions][] = [
      [[seg('walk', 20, 200)], 200, 20, 0, { preference: 'eco' }],
      [[seg('bus', 1, 1)], 1, 1, CO2_FACTORS.car * 1, { preference: 'balanced' }],
      [[seg('bike', 0.1, 1)], 1, 0.1, 0, { preference: 'fast' }],
    ]
    for (const [segs, dur, dist, co2, opts] of cases) {
      const score = computeScore(segs, dur, dist, co2, opts)
      expect(score).toBeGreaterThanOrEqual(0)
      expect(score).toBeLessThanOrEqual(100)
    }
  })

  it('distance nulle → co2Score = 100 (evite division par zéro)', () => {
    const segments = [seg('walk', 0, 1)]
    const score = computeScore(segments, 1, 0, 0, BASE_OPTIONS)
    expect(score).toBeGreaterThanOrEqual(0)
  })
})
