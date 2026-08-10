import type { TanStop } from '@shared/types/index'
import { getTanStops } from '../services/transport.service'
import { CACHE_KEYS, CACHE_TTL_MS } from '../constants/cache-keys'
import { useFetchResource } from './use-fetch-resource'

interface TanStopsState {
  stops: TanStop[]
  loading: boolean
  error: string | null
}

export function useTanStops(): TanStopsState {
  const { data, loading, error } = useFetchResource(
    CACHE_KEYS.tanStops,
    getTanStops,
    CACHE_TTL_MS.tanStops
  )
  return { stops: data ?? [], loading, error }
}
