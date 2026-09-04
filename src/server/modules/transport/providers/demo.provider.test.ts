import { describe, it, expect, afterEach } from 'vitest'
import { DemoProvider } from './demo.provider.js'
import { DEMO_SCENARIOS } from '../../../../shared/constants/demo-scenarios.js'
import { setDemoWeather } from '../../demo/demo-config.js'

describe('DemoProvider', () => {
  afterEach(() => {
    setDemoWeather(null)
  })

  it('serves the Commerce → Île de Nantes route even when weather is forced to rainy', async () => {
    const provider = new DemoProvider()
    const scenario = DEMO_SCENARIOS[0]
    setDemoWeather('rainy')

    const journeys = await provider.getJourneys(scenario.from, scenario.to, {
      preference: 'balanced',
    })

    expect(journeys[0].segments[0].from).toEqual(scenario.from)
  })

  it('serves the Gare de Nantes → Faculté des Sciences route even when weather is forced to sunny', async () => {
    const provider = new DemoProvider()
    const scenario = DEMO_SCENARIOS[1]
    setDemoWeather('sunny')

    const journeys = await provider.getJourneys(scenario.from, scenario.to, {
      preference: 'balanced',
    })

    expect(journeys[0].segments[0].from).toEqual(scenario.from)
  })
})
