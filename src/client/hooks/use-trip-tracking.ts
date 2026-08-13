import { useCallback, useEffect, useRef, useState } from 'react'
import { recordTrip } from '../services/gamification.service'
import type { RecordTripResult } from '../services/gamification.service'
import { useAuthStore } from '../stores/auth.store'
import { useGamificationStore } from '../stores/gamification.store'
import { useActiveTracking } from './use-active-tracking'
import type { Coordinates, Journey } from '@shared/types/index'

type TrackingPhase = 'idle' | 'consent' | 'active' | 'done'

interface ActiveTrackingState {
  startTime: number
  destination: Coordinates
}

interface UseTripTrackingOptions {
  selectedJourney: Journey | null
  /** Position stable passée à `useActiveTracking` hors suivi actif (le hook doit
   * rester monté sans dépendre d'une destination réelle). */
  fallbackDestination: Coordinates
}

/** Résultat local sans appel réseau pour un invité — `POST /api/gamification/record-trip`
 * est authGuard'd et un invité n'a pas de solde de points serveur. Un 401 ici
 * déclencherait un clearAuth() qui réinitialiserait isGuest (même piège que
 * fetchProfile sur MapPage) ; on construit donc un résultat à points nuls à
 * partir des données déjà connues côté client (CO2 déjà calculé par le
 * routing, public) pour que le résumé de trajet reste affichable. */
function buildGuestTripResult(journey: Journey): RecordTripResult {
  return {
    tripId: 'guest',
    co2SavedGrams: journey.co2SavingG,
    pointsEarned: 0,
    totalPoints: 0,
    newlyUnlockedBadges: [],
  }
}

/** Machine à états du suivi GPS d'un trajet : consentement → suivi actif → arrivée
 * (automatique par proximité GPS ou manuelle via "Terminer le trajet") → résumé.
 * Isolé de `MapPage` pour ne pas mélanger cette logique avec la recherche/le layout
 * de la carte (cf. code review "Frontend — Pages React"). */
export function useTripTracking({ selectedJourney, fallbackDestination }: UseTripTrackingOptions) {
  const isGuest = useAuthStore((s) => s.isGuest)
  const [trackingPhase, setTrackingPhase] = useState<TrackingPhase>('idle')
  const [activeTracking, setActiveTracking] = useState<ActiveTrackingState | null>(null)
  const [summaryResult, setSummaryResult] = useState<RecordTripResult | null>(null)
  const [summaryDurationMin, setSummaryDurationMin] = useState(0)
  const [showEndTripConfirm, setShowEndTripConfirm] = useState(false)
  const [tripResult, setTripResult] = useState<RecordTripResult | null>(null)
  const arrivalHandledRef = useRef(false)

  const {
    position: trackingPosition,
    arrived,
    stop: stopTracking,
  } = useActiveTracking({
    destination: activeTracking?.destination ?? fallbackDestination,
    active: trackingPhase === 'active',
  })

  // Fin de trajet — partagée entre l'arrivée GPS automatique (effet ci-dessous) et
  // la confirmation manuelle "Terminer le trajet" (confirmEndTrip).
  const finishTrip = useCallback(async () => {
    if (!selectedJourney || !activeTracking) return
    stopTracking()
    const realDurationMin = Math.round((Date.now() - activeTracking.startTime) / 60_000)
    if (isGuest) {
      setSummaryResult(buildGuestTripResult(selectedJourney))
      setSummaryDurationMin(Math.max(1, realDurationMin))
    } else {
      const { segments } = selectedJourney
      try {
        const result = await recordTrip(segments)
        useGamificationStore
          .getState()
          .setTripResult(result.totalPoints, result.newlyUnlockedBadges)
        setSummaryResult(result)
        setSummaryDurationMin(Math.max(1, realDurationMin))
      } catch {
        // Échec silencieux : le résumé ne s'affiche pas mais le suivi est bien arrêté
      }
    }
    setTrackingPhase('done')
    setActiveTracking(null)
  }, [selectedJourney, activeTracking, isGuest, stopTracking])

  // Détection d'arrivée
  useEffect(() => {
    if (!arrived || trackingPhase !== 'active' || arrivalHandledRef.current) return
    arrivalHandledRef.current = true
    void finishTrip()
  }, [arrived, trackingPhase, finishTrip])

  // "Partir maintenant" → ouvre la modale de consentement suivi
  const openConsent = useCallback(() => setTrackingPhase('consent'), [])

  // L'utilisateur accepte le suivi GPS continu
  const start = useCallback(() => {
    if (!selectedJourney) return
    const destination = selectedJourney.segments.at(-1)!.to
    arrivalHandledRef.current = false
    setActiveTracking({ startTime: Date.now(), destination })
    setTrackingPhase('active')
  }, [selectedJourney])

  // L'utilisateur refuse le suivi → enregistrement immédiat sans points
  const skip = useCallback(async () => {
    setTrackingPhase('idle')
    if (!selectedJourney) return
    if (isGuest) {
      setTripResult(buildGuestTripResult(selectedJourney))
      return
    }
    const { segments } = selectedJourney
    try {
      const result = await recordTrip(segments, false)
      setTripResult(result)
      useGamificationStore.getState().setTripResult(result.totalPoints, result.newlyUnlockedBadges)
    } catch {
      // Le toast ne s'affiche pas en cas d'erreur réseau — pas de crash UI
    }
  }, [selectedJourney, isGuest])

  const requestEndTrip = useCallback(() => setShowEndTripConfirm(true), [])
  const cancelEndTripConfirm = useCallback(() => setShowEndTripConfirm(false), [])

  // Fin manuelle via "Terminer le trajet" — passe par une confirmation avant
  // d'arrêter le suivi, contrairement à l'arrivée GPS automatique ci-dessus.
  const confirmEndTrip = useCallback(() => {
    setShowEndTripConfirm(false)
    void finishTrip()
  }, [finishTrip])

  // Abandon du suivi (fermeture du panneau pendant un suivi actif) : pas
  // d'arrivée ni de résumé, simple retour à idle.
  const abort = useCallback(() => {
    stopTracking()
    setActiveTracking(null)
    setTrackingPhase('idle')
  }, [stopTracking])

  const closeSummary = useCallback(() => setSummaryResult(null), [])
  const dismissTripToast = useCallback(() => setTripResult(null), [])

  return {
    trackingPhase,
    trackingPosition,
    showEndTripConfirm,
    summaryResult,
    summaryDurationMin,
    tripResult,
    openConsent,
    start,
    skip,
    requestEndTrip,
    cancelEndTripConfirm,
    confirmEndTrip,
    abort,
    closeSummary,
    dismissTripToast,
  }
}
