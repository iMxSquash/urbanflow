import { useCallback, useEffect, useState } from 'react'
import { getLastJourney, type CachedJourney } from '../utils/last-journey-cache'

export interface LastJourneyState {
  lastJourney: CachedJourney | null
  showDetail: boolean
  openDetail: () => void
  closeDetail: () => void
}

/** Dernier itinéraire mis en cache (IndexedDB, pas un appel réseau — la règle
 * CLAUDE.md « pas de useEffect pour les appels API » cible les appels HTTP au
 * backend, pas le stockage navigateur), relu à chaque passage hors ligne
 * plutôt qu'une seule fois au montage puisque l'appelant (`MapSheet`) reste
 * monté en continu. Possède aussi l'état d'ouverture de `LastJourneyModal` :
 * les deux ne concernent que ce module hors ligne, pas de raison de les
 * séparer. */
export function useLastJourney(offline: boolean): LastJourneyState {
  const [lastJourney, setLastJourney] = useState<CachedJourney | null>(null)
  const [showDetail, setShowDetail] = useState(false)

  // Sans ce reset, rouvrir une connexion pendant que la modale est ouverte la
  // laisserait flotter au-dessus du sheet redevenu normal. Ajusté pendant le
  // rendu (pattern React « adjusting state when a prop changes ») plutôt
  // qu'un effet, pour éviter un rendu en cascade évitable.
  const [prevOffline, setPrevOffline] = useState(offline)
  if (offline !== prevOffline) {
    setPrevOffline(offline)
    if (!offline) setShowDetail(false)
  }

  useEffect(() => {
    if (!offline) return
    let cancelled = false
    void getLastJourney().then((journey) => {
      if (!cancelled) setLastJourney(journey)
    })
    return () => {
      cancelled = true
    }
  }, [offline])

  const openDetail = useCallback(() => setShowDetail(true), [])
  const closeDetail = useCallback(() => setShowDetail(false), [])

  return { lastJourney, showDetail, openDetail, closeDetail }
}
