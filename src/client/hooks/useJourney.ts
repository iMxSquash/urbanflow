import { useCallback, useState } from 'react'
import type { Coordinates, Journey } from '@shared/types/index'
import type { JourneyProfile } from '../services/routing.service'
import { planJourney } from '../services/routing.service'

interface JourneyState {
  journey: Journey | null
  loading: boolean
  error: string | null
}

export function useJourney() {
  const [state, setState] = useState<JourneyState>({ journey: null, loading: false, error: null })

  const calculate = useCallback(async (
    from: Coordinates,
    to: Coordinates,
    profile?: JourneyProfile,
  ) => {
    setState({ journey: null, loading: true, error: null })
    try {
      const journeys = await planJourney(from, to, profile)
      if (journeys.length === 0) {
        setState({ journey: null, loading: false, error: 'Aucun itinéraire trouvé' })
      } else {
        // Trier par score décroissant et prendre le meilleur
        const sorted = [...journeys].sort((a, b) => b.score - a.score)
        setState({ journey: sorted[0], loading: false, error: null })
      }
    } catch (err) {
      setState({ journey: null, loading: false, error: (err as Error).message })
    }
  }, [])

  const clear = useCallback(() => {
    setState({ journey: null, loading: false, error: null })
  }, [])

  return { ...state, calculate, clear }
}
