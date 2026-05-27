import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { TRANSPORT_MODES } from '../../../shared/types/index.js'
import type { Journey, JourneyOptions, JourneySegment } from '../../../shared/types/index.js'

// ─── Mock providers avant import du service ───────────────────────────────────

const mocks = vi.hoisted(() => ({
  transitousGetJourneys: vi.fn<() => Promise<Journey[]>>(),
  osrmGetJourneys: vi.fn<() => Promise<Journey[]>>(),
  demoGetJourneys: vi.fn<() => Promise<Journey[]>>(),
}))

vi.mock('../transport/providers/transitous.provider.js', () => ({
  TransitousProvider: class {
    supportedModes = ['bus', 'tramway', 'navibus', 'train']
    getJourneys = mocks.transitousGetJourneys
  },
}))

vi.mock('../transport/providers/osrm.provider.js', () => ({
  OsrmProvider: class {
    supportedModes = ['bike', 'walk', 'scooter']
    getJourneys = mocks.osrmGetJourneys
  },
}))

vi.mock('../transport/providers/demo.provider.js', () => ({
  DemoProvider: class {
    supportedModes = [...TRANSPORT_MODES]
    getJourneys = mocks.demoGetJourneys
  },
}))

import { planJourney } from './routing.service.js'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const FROM = { lat: 47.218, lng: -1.553 }
const TO = { lat: 47.225, lng: -1.545 }

function seg(mode: JourneySegment['mode'], durationMin = 10): JourneySegment {
  return {
    mode,
    from: FROM,
    to: TO,
    distanceKm: 1,
    durationMin,
    co2g: 0,
  }
}

function makeJourney(id: string, score: number, segments: JourneySegment[]): Journey {
  return {
    id,
    label: 'Test',
    segments,
    totalDurationMin: segments.reduce((s, sg) => s + sg.durationMin, 0),
    totalDistanceKm: segments.reduce((s, sg) => s + sg.distanceKm, 0),
    totalCo2g: 0,
    co2SavingG: 0,
    score,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  delete process.env.DEMO_MODE
  mocks.transitousGetJourneys.mockResolvedValue([])
  mocks.osrmGetJourneys.mockResolvedValue([])
  mocks.demoGetJourneys.mockResolvedValue([])
})

afterEach(() => {
  delete process.env.DEMO_MODE
})

// ─── Sélection des providers ──────────────────────────────────────────────────

describe('planJourney — sélection des providers', () => {
  it('aucun mode sélectionné → seul TransitousProvider est appelé', async () => {
    const opts: JourneyOptions = { preference: 'balanced' }
    await planJourney(FROM, TO, opts)
    expect(mocks.transitousGetJourneys).toHaveBeenCalledOnce()
    expect(mocks.osrmGetJourneys).not.toHaveBeenCalled()
  })

  it('mode bus uniquement → seul TransitousProvider est appelé', async () => {
    const opts: JourneyOptions = { preference: 'balanced', modes: ['bus'] }
    await planJourney(FROM, TO, opts)
    expect(mocks.transitousGetJourneys).toHaveBeenCalledOnce()
    expect(mocks.osrmGetJourneys).not.toHaveBeenCalled()
  })

  it('mode tramway uniquement → seul TransitousProvider est appelé', async () => {
    const opts: JourneyOptions = { preference: 'balanced', modes: ['tramway'] }
    await planJourney(FROM, TO, opts)
    expect(mocks.transitousGetJourneys).toHaveBeenCalledOnce()
    expect(mocks.osrmGetJourneys).not.toHaveBeenCalled()
  })

  it('mode navibus → seul TransitousProvider est appelé', async () => {
    const opts: JourneyOptions = { preference: 'balanced', modes: ['navibus'] }
    await planJourney(FROM, TO, opts)
    expect(mocks.transitousGetJourneys).toHaveBeenCalledOnce()
    expect(mocks.osrmGetJourneys).not.toHaveBeenCalled()
  })

  it('mode train → seul TransitousProvider est appelé', async () => {
    const opts: JourneyOptions = { preference: 'balanced', modes: ['train'] }
    await planJourney(FROM, TO, opts)
    expect(mocks.transitousGetJourneys).toHaveBeenCalledOnce()
    expect(mocks.osrmGetJourneys).not.toHaveBeenCalled()
  })

  it('mode vélo uniquement → seul OsrmProvider est appelé', async () => {
    const opts: JourneyOptions = { preference: 'balanced', modes: ['bike'] }
    await planJourney(FROM, TO, opts)
    expect(mocks.osrmGetJourneys).toHaveBeenCalledOnce()
    expect(mocks.transitousGetJourneys).not.toHaveBeenCalled()
  })

  it('mode marche uniquement → seul OsrmProvider est appelé', async () => {
    const opts: JourneyOptions = { preference: 'balanced', modes: ['walk'] }
    await planJourney(FROM, TO, opts)
    expect(mocks.osrmGetJourneys).toHaveBeenCalledOnce()
    expect(mocks.transitousGetJourneys).not.toHaveBeenCalled()
  })

  it('mode scooter uniquement → seul OsrmProvider est appelé', async () => {
    const opts: JourneyOptions = { preference: 'balanced', modes: ['scooter'] }
    await planJourney(FROM, TO, opts)
    expect(mocks.osrmGetJourneys).toHaveBeenCalledOnce()
    expect(mocks.transitousGetJourneys).not.toHaveBeenCalled()
  })

  it('bus + vélo → les deux providers sont appelés', async () => {
    const opts: JourneyOptions = { preference: 'balanced', modes: ['bus', 'bike'] }
    await planJourney(FROM, TO, opts)
    expect(mocks.transitousGetJourneys).toHaveBeenCalledOnce()
    expect(mocks.osrmGetJourneys).toHaveBeenCalledOnce()
  })

  it('tramway + marche → les deux providers sont appelés', async () => {
    const opts: JourneyOptions = { preference: 'balanced', modes: ['tramway', 'walk'] }
    await planJourney(FROM, TO, opts)
    expect(mocks.transitousGetJourneys).toHaveBeenCalledOnce()
    expect(mocks.osrmGetJourneys).toHaveBeenCalledOnce()
  })
})

// ─── Mode démo ────────────────────────────────────────────────────────────────

describe('planJourney — DEMO_MODE', () => {
  it('DEMO_MODE=true → seul DemoProvider est appelé', async () => {
    process.env.DEMO_MODE = 'true'
    const opts: JourneyOptions = { preference: 'balanced', modes: ['bus', 'bike'] }
    await planJourney(FROM, TO, opts)
    expect(mocks.demoGetJourneys).toHaveBeenCalledOnce()
    expect(mocks.transitousGetJourneys).not.toHaveBeenCalled()
    expect(mocks.osrmGetJourneys).not.toHaveBeenCalled()
  })

  it('DEMO_MODE=false → les providers réels sont appelés', async () => {
    process.env.DEMO_MODE = 'false'
    const opts: JourneyOptions = { preference: 'balanced', modes: ['bus'] }
    await planJourney(FROM, TO, opts)
    expect(mocks.demoGetJourneys).not.toHaveBeenCalled()
    expect(mocks.transitousGetJourneys).toHaveBeenCalledOnce()
  })
})

// ─── Filtre modes post-merge ──────────────────────────────────────────────────

describe('planJourney — filtre modes post-merge', () => {
  it('un itinéraire avec segment tramway est filtré si seul bus demandé', async () => {
    const journey = makeJourney('j1', 80, [seg('tramway', 20)])
    mocks.transitousGetJourneys.mockResolvedValue([journey])
    const opts: JourneyOptions = { preference: 'balanced', modes: ['bus'] }
    const result = await planJourney(FROM, TO, opts)
    expect(result).toHaveLength(0)
  })

  it('la marche est toujours tolérée comme mode de connexion', async () => {
    const journey = makeJourney('j1', 80, [seg('walk', 5), seg('bus', 15)])
    mocks.transitousGetJourneys.mockResolvedValue([journey])
    const opts: JourneyOptions = { preference: 'balanced', modes: ['bus'] }
    const result = await planJourney(FROM, TO, opts)
    expect(result).toHaveLength(1)
  })

  it('itinéraire avec uniquement les modes demandés passe le filtre', async () => {
    const journey = makeJourney('j1', 80, [seg('bus', 20), seg('tramway', 10)])
    mocks.transitousGetJourneys.mockResolvedValue([journey])
    const opts: JourneyOptions = { preference: 'balanced', modes: ['bus', 'tramway'] }
    const result = await planJourney(FROM, TO, opts)
    expect(result).toHaveLength(1)
  })

  it('sans modes sélectionnés → tous les itinéraires passent', async () => {
    const journeys = [
      makeJourney('j1', 80, [seg('bus', 20)]),
      makeJourney('j2', 70, [seg('tramway', 15)]),
      makeJourney('j3', 60, [seg('bike', 12)]),
    ]
    mocks.transitousGetJourneys.mockResolvedValue(journeys)
    const opts: JourneyOptions = { preference: 'balanced' }
    const result = await planJourney(FROM, TO, opts)
    expect(result).toHaveLength(3)
  })
})

// ─── Filtre maxWalkMinutes ────────────────────────────────────────────────────

describe('planJourney — filtre dur maxWalkMinutes', () => {
  it("segment marche dépassant maxWalkMinutes élimine l'itinéraire", async () => {
    const journey = makeJourney('j1', 80, [seg('walk', 25), seg('bus', 15)])
    mocks.transitousGetJourneys.mockResolvedValue([journey])
    const opts: JourneyOptions = {
      preference: 'balanced',
      modes: ['walk', 'bus'],
      maxWalkMinutes: 20,
    }
    const result = await planJourney(FROM, TO, opts)
    expect(result).toHaveLength(0)
  })

  it('segment marche exactement à maxWalkMinutes est conservé', async () => {
    const journey = makeJourney('j1', 80, [seg('walk', 20), seg('bus', 15)])
    mocks.transitousGetJourneys.mockResolvedValue([journey])
    const opts: JourneyOptions = {
      preference: 'balanced',
      modes: ['walk', 'bus'],
      maxWalkMinutes: 20,
    }
    const result = await planJourney(FROM, TO, opts)
    expect(result).toHaveLength(1)
  })

  it('PMR : maxWalkMinutes est réduit à 5 min', async () => {
    const journeyOk = makeJourney('j1', 80, [seg('walk', 4), seg('bus', 15)])
    const journeyKo = makeJourney('j2', 70, [seg('walk', 8), seg('bus', 15)])
    mocks.transitousGetJourneys.mockResolvedValue([journeyOk, journeyKo])
    const opts: JourneyOptions = {
      preference: 'balanced',
      modes: ['walk', 'bus'],
      maxWalkMinutes: 30,
      pmrAccessibility: true,
    }
    const result = await planJourney(FROM, TO, opts)
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('j1')
  })

  it('PMR : maxWalkMinutes explicitement inférieur à 5 est respecté tel quel', async () => {
    // Si l'utilisateur a déjà mis maxWalkMinutes=3, PMR applique min(3,5)=3
    const journeyOk = makeJourney('j1', 80, [seg('walk', 3), seg('bus', 15)])
    const journeyKo = makeJourney('j2', 70, [seg('walk', 4), seg('bus', 15)])
    mocks.transitousGetJourneys.mockResolvedValue([journeyOk, journeyKo])
    const opts: JourneyOptions = {
      preference: 'balanced',
      modes: ['walk', 'bus'],
      maxWalkMinutes: 3,
      pmrAccessibility: true,
    }
    const result = await planJourney(FROM, TO, opts)
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('j1')
  })

  it("sans segment marche → pas d'impact du filtre maxWalkMinutes", async () => {
    const journey = makeJourney('j1', 80, [seg('bus', 30)])
    mocks.transitousGetJourneys.mockResolvedValue([journey])
    const opts: JourneyOptions = { preference: 'balanced', modes: ['bus'], maxWalkMinutes: 5 }
    const result = await planJourney(FROM, TO, opts)
    expect(result).toHaveLength(1)
  })
})

// ─── Tri par score ────────────────────────────────────────────────────────────

describe('planJourney — tri par score décroissant', () => {
  it('les itinéraires sont retournés du plus haut au plus bas score', async () => {
    const journeys = [
      makeJourney('low', 40, [seg('bus', 30)]),
      makeJourney('high', 90, [seg('bus', 10)]),
      makeJourney('mid', 65, [seg('bus', 20)]),
    ]
    mocks.transitousGetJourneys.mockResolvedValue(journeys)
    const opts: JourneyOptions = { preference: 'balanced' }
    const result = await planJourney(FROM, TO, opts)
    expect(result.map((j) => j.id)).toEqual(['high', 'mid', 'low'])
  })

  it('résultats agrégés de plusieurs providers sont triés ensemble', async () => {
    mocks.transitousGetJourneys.mockResolvedValue([
      makeJourney('tc-low', 30, [seg('bus', 30)]),
      makeJourney('tc-high', 85, [seg('bus', 5)]),
    ])
    mocks.osrmGetJourneys.mockResolvedValue([makeJourney('osrm-mid', 60, [seg('bike', 15)])])
    const opts: JourneyOptions = { preference: 'balanced', modes: ['bus', 'bike'] }
    const result = await planJourney(FROM, TO, opts)
    expect(result.map((j) => j.id)).toEqual(['tc-high', 'osrm-mid', 'tc-low'])
  })
})

// ─── Résilience provider ──────────────────────────────────────────────────────

describe('planJourney — résilience provider', () => {
  it('si un provider échoue, les résultats des autres sont conservés', async () => {
    mocks.transitousGetJourneys.mockRejectedValue(new Error('Transitous indisponible'))
    mocks.osrmGetJourneys.mockResolvedValue([makeJourney('osrm-j1', 75, [seg('bike', 12)])])
    const opts: JourneyOptions = { preference: 'balanced', modes: ['bus', 'bike'] }
    const result = await planJourney(FROM, TO, opts)
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('osrm-j1')
  })

  it('si tous les providers échouent, retourne un tableau vide', async () => {
    mocks.transitousGetJourneys.mockRejectedValue(new Error('réseau'))
    mocks.osrmGetJourneys.mockRejectedValue(new Error('réseau'))
    const opts: JourneyOptions = { preference: 'balanced', modes: ['bus', 'bike'] }
    const result = await planJourney(FROM, TO, opts)
    expect(result).toEqual([])
  })
})
