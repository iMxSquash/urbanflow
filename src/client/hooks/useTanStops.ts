import { useEffect, useState } from 'react'
import type { TanStop } from '@shared/types/index'
import { getTanStops } from '../services/transport.service'

interface TanStopsState {
  stops: TanStop[]
  loading: boolean
  error: string | null
}

export function useTanStops(): TanStopsState {
  const [state, setState] = useState<TanStopsState>({ stops: [], loading: true, error: null })

  useEffect(() => {
    const controller = new AbortController()

    getTanStops(controller.signal)
      .then((stops) => setState({ stops, loading: false, error: null }))
      .catch((err: Error) => {
        if (err.name !== 'AbortError') {
          setState({ stops: [], loading: false, error: err.message })
        }
      })

    return () => controller.abort()
  }, [])

  return state
}
