import type { Coordinates, Journey, JourneyOptions, TransportMode } from '@shared/types/index.js'
import type { TransportProvider } from '../transport/transport-provider.interface.js'
import { DemoProvider } from '../transport/providers/demo.provider.js'
import { OsrmProvider } from '../transport/providers/osrm.provider.js'
import { TransitousProvider } from '../transport/providers/transitous.provider.js'
import { getCurrentWeather } from './weather.service.js'
import { computeScore, computeEstimatedCost, computeComfortScore } from './scoring.service.js'
import { isDemoMode } from '../demo/demo-config.js'
import { haversineKm } from '../../utils/geo.js'
import { CO2_FACTORS } from '@shared/constants/co2-factors.js'

// ─── Registre des providers ───────────────────────────────────────────────────
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

const TC_MODES = new Set<TransportMode>(['bus', 'tramway', 'navibus', 'train'])
const ACTIVE_MODES = new Set<TransportMode>(['bike', 'walk', 'scooter'])

function selectProviders(options: JourneyOptions): TransportProvider[] {
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

export async function planJourney(
  from: Coordinates,
  to: Coordinates,
  options: JourneyOptions
): Promise<Journey[]> {
  // Start weather fetch immediately — providers run concurrently, not after it resolves.
  // By the time providers complete (typically 1-3s), weather is usually already cached.
  const weatherPromise = getCurrentWeather().catch(() => null)

  const providers = selectProviders(options)
  const modeNames = providers.map((p) => p.supportedModes.join('/')).join(', ')
  console.log(`[routing] ${providers.length} provider(s) activé(s) : [${modeNames}]`)

  const results = await Promise.allSettled(providers.map((p) => p.getJourneys(from, to, options)))

  // Await weather only after providers — likely already resolved, worst case waits remaining timeout
  const weather = await weatherPromise

  const journeys: Journey[] = []
  let needsDemoFallback = false

  for (const result of results) {
    if (result.status === 'fulfilled') {
      journeys.push(...result.value)
    } else {
      const msg = result.reason instanceof Error ? result.reason.message : String(result.reason)
      console.warn('[routing] Provider indisponible, fallback démo —', msg)
      needsDemoFallback = true
    }
  }

  if (needsDemoFallback) {
    try {
      const demoJourneys = await DEMO_PROVIDER.getJourneys(from, to, options)
      journeys.push(...demoJourneys)
    } catch (err) {
      console.error('[routing] DemoProvider indisponible :', err)
    }
  }

  // Filtre post-merge : si l'utilisateur a des modes préférés, éliminer les
  // itinéraires contenant des segments de modes non souhaités.
  // La marche est toujours tolérée comme mode de connexion.
  const allowedModes = options.modes ?? []
  const filtered =
    allowedModes.length === 0
      ? journeys
      : journeys.filter((j) =>
          j.segments.every((s) => s.mode === 'walk' || allowedModes.includes(s.mode))
        )

  if (allowedModes.length > 0 && filtered.length < journeys.length) {
    console.log(
      `[routing] Filtre modes [${allowedModes.join(', ')}] : ${journeys.length} → ${filtered.length} itinéraire(s)`
    )
  }

  // Filtre dur maxWalkMinutes : éliminer tout itinéraire dont un segment marche
  // dépasse le seuil de l'utilisateur (PMR réduit ce seuil à 5 min).
  const maxWalk = options.pmrAccessibility
    ? Math.min(options.maxWalkMinutes ?? 30, 5)
    : (options.maxWalkMinutes ?? 30)

  const withWalkFilter = filtered.filter((j) =>
    j.segments.filter((s) => s.mode === 'walk').every((s) => s.durationMin <= maxWalk)
  )

  if (withWalkFilter.length < filtered.length) {
    console.log(
      `[routing] Filtre maxWalkMinutes=${maxWalk}min : ${filtered.length} → ${withWalkFilter.length} itinéraire(s)`
    )
  }

  // Filtre horaire : ne garder que les trajets TC partant dans les 90 min après l'heure
  // de référence (5 min de tolérance passée pour le décalage horloge). Sans ce filtre,
  // l'API OTP peut renvoyer des itinéraires pour des connexions tardives même quand
  // l'heure demandée est "maintenant". Ne s'applique pas au mode "arriver avant".
  const MAX_LEAD_MS = 90 * 60_000
  const PAST_BUFFER_MS = 5 * 60_000
  const refMs = (options.departureTime ?? new Date()).getTime()

  const upcoming =
    options.datetimeType === 'arrival'
      ? withWalkFilter
      : withWalkFilter.filter((j) => {
          if (!j.departureTime) return true // modes actifs (OSRM) — pas d'horaire fixe
          const deptMs = new Date(j.departureTime).getTime()
          return deptMs >= refMs - PAST_BUFFER_MS && deptMs <= refMs + MAX_LEAD_MS
        })

  if (upcoming.length < withWalkFilter.length) {
    console.log(
      `[routing] Filtre horaire ±90min : ${withWalkFilter.length} → ${upcoming.length} itinéraire(s)`
    )
  }

  // Déduplication par label (séquence de modes visible) : Transitous renvoie plusieurs
  // itinéraires pour la même connexion à des horaires différents. On garde un seul par
  // type de trajet — celui dont le départ est le plus proche de l'heure demandée.
  // Mode "arriver avant" : parmi les doublons on garde le départ le plus tardif (partir
  // le plus tard possible en arrivant à temps).
  const labelGroups = new Map<string, Journey[]>()
  for (const j of upcoming) {
    const group = labelGroups.get(j.label) ?? []
    group.push(j)
    labelGroups.set(j.label, group)
  }

  const deduped = [...labelGroups.values()].map((group) => {
    if (group.length === 1) return group[0]
    return group.reduce((best, j) => {
      const jMs = j.departureTime ? new Date(j.departureTime).getTime() : refMs
      const bestMs = best.departureTime ? new Date(best.departureTime).getTime() : refMs
      if (options.datetimeType === 'arrival') {
        return jMs > bestMs ? j : best // arriver avant : partir le plus tard possible
      }
      // partir à partir de : garder le premier départ futur, ou le plus récent si passés
      const jDiff = jMs - refMs
      const bestDiff = bestMs - refMs
      if (jDiff >= 0 && bestDiff >= 0) return jDiff < bestDiff ? j : best
      if (jDiff >= 0) return j
      if (bestDiff >= 0) return best
      return jDiff > bestDiff ? j : best
    })
  })

  if (deduped.length < upcoming.length) {
    console.log(
      `[routing] Déduplication par label : ${upcoming.length} → ${deduped.length} itinéraire(s)`
    )
  }

  // Recalcule co2SavingG avec une référence voiture cohérente pour tous les trajets.
  // Chaque provider utilise sa propre distance de routage, ce qui rend les économies
  // incomparables (ex: OSRM donne 6.7km vélo, Transitous 7.1km TC → références ≠).
  // On utilise la distance haversine OD comme proxy voiture unique pour cette requête.
  const carRefKm = haversineKm(from, to)
  const carRefCo2g = Math.round(carRefKm * CO2_FACTORS.car)
  for (const journey of deduped) {
    journey.co2SavingG = Math.max(0, carRefCo2g - journey.totalCo2g)
  }

  // Re-score with weather now that all journeys are merged and filtered.
  // Providers computed a preliminary score without weather context.
  if (weather) {
    for (const journey of deduped) {
      journey.score = computeScore(
        journey.segments,
        journey.totalDurationMin,
        journey.totalDistanceKm,
        journey.totalCo2g,
        options,
        weather
      )
    }
    console.log(`[routing] Re-scoring avec météo : ${weather.condition} ${weather.temperature}°C`)
  }

  for (const journey of deduped) {
    journey.comfortScore = computeComfortScore(journey.segments, options, weather ?? undefined)
    journey.estimatedCostEur = computeEstimatedCost(journey.segments)
  }

  return deduped.sort((a, b) => b.score - a.score)
}
