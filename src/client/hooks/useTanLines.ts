import type { TanLine } from '@shared/types/index'
import { getTanLines } from '../services/transport.service'
import { CACHE_KEYS, CACHE_TTL_MS } from '../constants/cache-keys'
import { useFetchResource } from './useFetchResource'

interface TanLinesState {
  lines: TanLine[]
  loading: boolean
  error: string | null
}

export function useTanLines(): TanLinesState {
  const { data, loading, error } = useFetchResource(
    CACHE_KEYS.tanLines,
    getTanLines,
    CACHE_TTL_MS.tanLines
  )
  return { lines: data ?? [], loading, error }
}
