import { useCallback, useState } from 'react'
import type { Coordinates, Journey } from '@shared/types/index'
import { planJourney } from '../services/routing.service'

interface JourneyState {
  journey: Journey | null
  loading: boolean
  error: string | null
}

export function useJourney() {
  const [state, setState] = useState<JourneyState>({ journey: null, loading: false, error: null })

  const calculate = useCallback(async (from: Coordinates, to: Coordinates) => {
    setState({ journey: null, loading: true, error: null })
    try {
      const journeys = await planJourney(from, to)
      if (journeys.length === 0) {
        setState({ journey: null, loading: false, error: 'Aucun itinéraire trouvé' })
      } else {
        setState({ journey: journeys[0], loading: false, error: null })
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
