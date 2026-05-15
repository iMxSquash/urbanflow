import { useEffect, useState } from 'react'
import type { TanLine } from '@shared/types/index'
import { getTanLines } from '../services/transport.service'

interface TanLinesState {
  lines: TanLine[]
  loading: boolean
  error: string | null
}

export function useTanLines(): TanLinesState {
  const [state, setState] = useState<TanLinesState>({ lines: [], loading: true, error: null })

  useEffect(() => {
    const controller = new AbortController()

    getTanLines(controller.signal)
      .then((lines) => setState({ lines, loading: false, error: null }))
      .catch((err: Error) => {
        if (err.name !== 'AbortError') {
          setState({ lines: [], loading: false, error: err.message })
        }
      })

    return () => controller.abort()
  }, [])

  return state
}
