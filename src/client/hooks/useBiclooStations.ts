import { useEffect, useState } from 'react'
import type { BiclooStation } from '@shared/types/index'
import { getBiclooStations } from '../services/transport.service'

interface BiclooState {
  stations: BiclooStation[]
  loading: boolean
  error: string | null
}

export function useBiclooStations(): BiclooState {
  const [state, setState] = useState<BiclooState>({
    stations: [],
    loading: true,
    error: null,
  })

  useEffect(() => {
    const controller = new AbortController()

    getBiclooStations(controller.signal)
      .then((stations) => setState({ stations, loading: false, error: null }))
      .catch((err: Error) => {
        if (err.name !== 'AbortError') {
          setState({ stations: [], loading: false, error: err.message })
        }
      })

    return () => controller.abort()
  }, [])

  return state
}
