import type { BiclooStation } from '@shared/types/index'
import { getBiclooStations } from '../services/transport.service'
import { CACHE_KEYS, CACHE_TTL_MS } from '../constants/cache-keys'
import { useFetchResource } from './use-fetch-resource'

interface BiclooState {
  stations: BiclooStation[]
  loading: boolean
  error: string | null
}

export function useBiclooStations(): BiclooState {
  const { data, loading, error } = useFetchResource(
    CACHE_KEYS.biclooStations,
    getBiclooStations,
    CACHE_TTL_MS.biclooStations
  )
  return { stations: data ?? [], loading, error }
}
