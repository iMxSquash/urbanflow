import type { Coordinates, Journey, JourneyOptions } from '@shared/types/index.js'
import type { TransportProvider } from '../transport/transport-provider.interface.js'
import { DemoProvider } from '../transport/providers/demo.provider.js'
import { TransitousProvider } from '../transport/providers/transitous.provider.js'

function resolveProvider(): TransportProvider {
  if (process.env.DEMO_MODE === 'true') return new DemoProvider()
  const key = process.env.TRANSPORT_PROVIDER ?? 'demo'
  if (key === 'transitous') return new TransitousProvider()
  return new DemoProvider()
}

// Instancié une seule fois au démarrage du module
const provider = resolveProvider()

export async function planJourney(
  from: Coordinates,
  to: Coordinates,
  options: JourneyOptions
): Promise<Journey[]> {
  return provider.getJourneys(from, to, options)
}
