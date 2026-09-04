import type { Coordinates, Journey, JourneyOptions } from '@shared/types/index.js'
import { selectProviders, getDemoProvider } from '../transport/provider-registry.js'
import { getCurrentWeather } from './weather.service.js'
import {
  computeScore,
  computeEstimatedCost,
  computeComfortScore,
  effectiveMaxWalkMinutes,
} from './scoring.service.js'
import { haversineKm } from '../../utils/geo.js'
import { CO2_FACTORS } from '@shared/constants/co2-factors.js'

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
      const demoJourneys = await getDemoProvider().getJourneys(from, to, options)
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

  // Filtre dur PMR : élimine les itinéraires vélo/trottinette, non adaptés aux
  // besoins PMR. OsrmProvider rejette déjà ces modes en amont pour les providers
  // réels, mais le repli démo (getDemoProvider ci-dessus) ignore `options` et
  // renvoie tous les itinéraires du fixture — ce filtre garantit la même règle
  // pour tous les providers, y compris le démo.
  const withoutPmrExcludedModes = options.pmrAccessibility
    ? filtered.filter((j) => j.segments.every((s) => s.mode !== 'bike' && s.mode !== 'scooter'))
    : filtered

  if (options.pmrAccessibility && withoutPmrExcludedModes.length < filtered.length) {
    console.log(
      `[routing] Filtre PMR (vélo/trottinette exclus) : ${filtered.length} → ${withoutPmrExcludedModes.length} itinéraire(s)`
    )
  }

  // Filtre dur maxWalkMinutes : éliminer tout itinéraire dont un segment marche
  // dépasse le seuil de l'utilisateur (PMR réduit ce seuil à 10 min).
  const maxWalk = effectiveMaxWalkMinutes(options)

  const withWalkFilter = withoutPmrExcludedModes.filter((j) =>
    j.segments.filter((s) => s.mode === 'walk').every((s) => s.durationMin <= maxWalk)
  )

  if (withWalkFilter.length < withoutPmrExcludedModes.length) {
    console.log(
      `[routing] Filtre maxWalkMinutes=${maxWalk}min : ${withoutPmrExcludedModes.length} → ${withWalkFilter.length} itinéraire(s)`
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
  // Seuls les trajets avec un departureTime explicite (TC) sont concernés ; les modes
  // actifs (OSRM — vélo, marche, scooter) n'ont pas d'horaire fixe et passent tels quels.
  // Mode "arriver avant" : parmi les doublons on garde le départ le plus tardif.
  const withTime = upcoming.filter((j) => j.departureTime)
  const withoutTime = upcoming.filter((j) => !j.departureTime)

  const labelGroups = new Map<string, Journey[]>()
  for (const j of withTime) {
    const group = labelGroups.get(j.label) ?? []
    group.push(j)
    labelGroups.set(j.label, group)
  }

  const dedupedTC = [...labelGroups.values()].map((group) => {
    if (group.length === 1) return group[0]
    return group.reduce((best, j) => {
      const jMs = new Date(j.departureTime!).getTime()
      const bestMs = new Date(best.departureTime!).getTime()
      if (options.datetimeType === 'arrival') {
        return jMs > bestMs ? j : best // arriver avant : partir le plus tard possible
      }
      // partir à partir de : premier départ futur, ou le plus récent si tous passés
      const jDiff = jMs - refMs
      const bestDiff = bestMs - refMs
      if (jDiff >= 0 && bestDiff >= 0) return jDiff < bestDiff ? j : best
      if (jDiff >= 0) return j
      if (bestDiff >= 0) return best
      return jDiff > bestDiff ? j : best
    })
  })

  const deduped = [...dedupedTC, ...withoutTime]

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

  // Score calculé une seule fois ici, une fois tous les itinéraires fusionnés et
  // filtrés — les providers ne connaissent pas scoring.service.ts (pas de
  // dépendance circulaire transport → routing, pas de calcul en double).
  for (const journey of deduped) {
    journey.score = computeScore(
      journey.segments,
      journey.totalDurationMin,
      journey.totalDistanceKm,
      journey.totalCo2g,
      options,
      weather
    )
    journey.comfortScore = computeComfortScore(journey.segments, options, weather)
    journey.estimatedCostEur = computeEstimatedCost(journey.segments)
  }

  if (weather) {
    console.log(
      `[routing] Score calculé avec météo : ${weather.condition} ${weather.temperature}°C`
    )
  }

  return deduped.sort((a, b) => b.score - a.score)
}
