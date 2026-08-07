import type { JourneyOptions, TransportMode } from '@shared/types/index.js'
import { TC_TRANSPORT_MODES, ACTIVE_TRANSPORT_MODES } from '@shared/constants/transport-modes.js'
import type { TransportProvider } from './transport-provider.interface.js'
import { DemoProvider } from './providers/demo.provider.js'
import { OsrmProvider } from './providers/osrm.provider.js'
import { TransitousProvider } from './providers/transitous.provider.js'
import { isDemoMode } from '../demo/demo-config.js'

// ─── Registre des providers ───────────────────────────────────────────────────
// Seul module autorisé à connaître les implémentations concrètes des providers
// (TransitousProvider, OsrmProvider, DemoProvider) — routing.service.ts ne
// manipule que l'interface TransportProvider via selectProviders()/getDemoProvider().
//
// Catégories :
//   'tc'     — transports en commun (bus, tramway, train, ferry…)
//   'active' — mobilité active et douce (vélo, marche, trottinette)
//   'shared' — mobilités partagées futures (covoiturage, VTC…) — toujours activés

type ProviderCategory = 'tc' | 'active' | 'shared'

interface RegisteredProvider {
  provider: TransportProvider
  category: ProviderCategory
}

const PROVIDER_REGISTRY: RegisteredProvider[] = [
  { provider: new TransitousProvider(), category: 'tc' },
  { provider: new OsrmProvider(), category: 'active' },
  // Pour ajouter un provider : { provider: new MyProvider(), category: 'tc' | 'active' | 'shared' }
]

const DEMO_PROVIDER = new DemoProvider()

const TC_MODES = new Set<TransportMode>(TC_TRANSPORT_MODES)
const ACTIVE_MODES = new Set<TransportMode>(ACTIVE_TRANSPORT_MODES)

export function getDemoProvider(): TransportProvider {
  return DEMO_PROVIDER
}

export function selectProviders(options: JourneyOptions): TransportProvider[] {
  if (isDemoMode()) return [DEMO_PROVIDER]

  const requestedModes: TransportMode[] = options.modes ?? []

  // Aucun mode sélectionné → providers TC par défaut
  if (requestedModes.length === 0) {
    return PROVIDER_REGISTRY.filter((r) => r.category === 'tc').map((r) => r.provider)
  }

  const wantsTC = requestedModes.some((m) => TC_MODES.has(m))
  const wantsActive = requestedModes.some((m) => ACTIVE_MODES.has(m))

  const selected = PROVIDER_REGISTRY.filter(
    (r) =>
      (r.category === 'tc' && wantsTC) ||
      (r.category === 'active' && wantsActive) ||
      r.category === 'shared'
  ).map((r) => r.provider)

  // Fallback TC si aucun provider sélectionné (mode inconnu)
  return selected.length > 0
    ? selected
    : PROVIDER_REGISTRY.filter((r) => r.category === 'tc').map((r) => r.provider)
}
