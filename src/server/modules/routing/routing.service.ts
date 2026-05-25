import type { Coordinates, Journey, JourneyOptions, TransportMode } from '@shared/types/index.js'
import type { TransportProvider } from '../transport/transport-provider.interface.js'
import { DemoProvider } from '../transport/providers/demo.provider.js'
import { OsrmProvider } from '../transport/providers/osrm.provider.js'
import { TransitousProvider } from '../transport/providers/transitous.provider.js'
import { getCurrentWeather } from './weather.service.js'
import { computeScore, computeEstimatedCost, computeComfortScore } from './scoring.service.js'
import { isDemoMode } from '../demo/demo-config.js'

// Tous les providers disponibles (hors mode démo)
const ALL_PROVIDERS: TransportProvider[] = [new TransitousProvider(), new OsrmProvider()]

const DEMO_PROVIDER = new DemoProvider()

const TC_PROVIDER = ALL_PROVIDERS.find((p) => p.supportedModes.includes('bus'))! // TransitousProvider

function selectProviders(options: JourneyOptions): TransportProvider[] {
  if (isDemoMode()) return [DEMO_PROVIDER]

  const requestedModes: TransportMode[] = options.modes ?? []

  // Aucun mode sélectionné → Transitous seul (fallback TC par défaut)
  if (requestedModes.length === 0) return [TC_PROVIDER]

  const selected: TransportProvider[] = []

  // Transitous : activé si l'utilisateur veut un mode TC (bus, tramway, navibus, train)
  const wantsTC = requestedModes.some((m) => TC_PROVIDER.supportedModes.includes(m))
  if (wantsTC) selected.push(TC_PROVIDER)

  // OSRM : activé si l'utilisateur veut vélo, trottinette ou marche
  const osrm = ALL_PROVIDERS.find((p) => p.supportedModes.includes('bike'))
  const wantsOsrm =
    osrm &&
    (requestedModes.includes('bike') ||
      requestedModes.includes('scooter') ||
      requestedModes.includes('walk'))
  if (wantsOsrm && osrm) selected.push(osrm)

  // Si aucun provider sélectionné (ex: mode inconnu non géré), fallback TC
  return selected.length > 0 ? selected : [TC_PROVIDER]
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

  // Re-score with weather now that all journeys are merged and filtered.
  // Providers computed a preliminary score without weather context.
  if (weather) {
    for (const journey of withWalkFilter) {
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

  for (const journey of withWalkFilter) {
    journey.comfortScore = computeComfortScore(journey.segments, options, weather ?? undefined)
    journey.estimatedCostEur = computeEstimatedCost(journey.segments)
  }

  return withWalkFilter.sort((a, b) => b.score - a.score)
}
