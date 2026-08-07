import type { BiclooStation } from '@shared/types/index'
import { getBiclooStations } from '../services/transport.service'
import { useFetchResource } from './useFetchResource'

interface BiclooState {
  stations: BiclooStation[]
  loading: boolean
  error: string | null
}

// Stations Bicloo — quasi temps réel (remplissage), TTL court.
const TTL_MS = 60 * 1000

export function useBiclooStations(): BiclooState {
  const { data, loading, error } = useFetchResource(
    'bicloo-stations',
    () => getBiclooStations(),
    TTL_MS
  )
  return { stations: data ?? [], loading, error }
}
