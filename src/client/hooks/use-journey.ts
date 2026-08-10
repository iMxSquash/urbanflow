import { useCallback, useState } from 'react'
import type { Coordinates, Journey } from '@shared/types/index'
import type { JourneyProfile } from '../services/routing.service'
import { planJourney } from '../services/routing.service'

interface JourneyState {
  journeys: Journey[]
  selectedJourney: Journey | null
  loading: boolean
  error: string | null
}

export function useJourney() {
  const [state, setState] = useState<JourneyState>({
    journeys: [],
    selectedJourney: null,
    loading: false,
    error: null,
  })

  const calculate = useCallback(
    async (
      from: Coordinates,
      to: Coordinates,
      profile?: JourneyProfile,
      datetime?: Date,
      datetimeType?: 'departure' | 'arrival'
    ) => {
      setState({ journeys: [], selectedJourney: null, loading: true, error: null })
      try {
        const journeys = await planJourney(from, to, profile, datetime, datetimeType)
        if (journeys.length === 0) {
          setState({
            journeys: [],
            selectedJourney: null,
            loading: false,
            error: 'Aucun itinéraire trouvé',
          })
        } else {
          setState({ journeys, selectedJourney: null, loading: false, error: null })
        }
      } catch (err) {
        setState({
          journeys: [],
          selectedJourney: null,
          loading: false,
          error: (err as Error).message,
        })
      }
    },
    []
  )

  const select = useCallback((journey: Journey) => {
    setState((s) => ({ ...s, selectedJourney: journey }))
  }, [])

  // Revient à la liste des résultats sans les effacer
  const deselect = useCallback(() => {
    setState((s) => ({ ...s, selectedJourney: null }))
  }, [])

  const clear = useCallback(() => {
    setState({ journeys: [], selectedJourney: null, loading: false, error: null })
  }, [])

  return { ...state, calculate, select, deselect, clear }
}
