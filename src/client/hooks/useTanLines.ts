import type { TanLine } from '@shared/types/index'
import { getTanLines } from '../services/transport.service'
import { useFetchResource } from './useFetchResource'

interface TanLinesState {
  lines: TanLine[]
  loading: boolean
  error: string | null
}

// Lignes Naolib — référence quasi statique en session, TTL long.
const TTL_MS = 10 * 60 * 1000

export function useTanLines(): TanLinesState {
  const { data, loading, error } = useFetchResource('tan-lines', () => getTanLines(), TTL_MS)
  return { lines: data ?? [], loading, error }
}
