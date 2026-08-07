import type { TanStop } from '@shared/types/index'
import { getTanStops } from '../services/transport.service'
import { useFetchResource } from './useFetchResource'

interface TanStopsState {
  stops: TanStop[]
  loading: boolean
  error: string | null
}

// Arrêts Naolib — référence quasi statique en session, TTL long.
const TTL_MS = 10 * 60 * 1000

export function useTanStops(): TanStopsState {
  const { data, loading, error } = useFetchResource('tan-stops', () => getTanStops(), TTL_MS)
  return { stops: data ?? [], loading, error }
}
