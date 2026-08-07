import { useEffect, useState } from 'react'
import { useResourceCacheStore, fetchCached } from '../stores/resource-cache.store'

interface UseFetchResourceResult<T> {
  data: T | undefined
  loading: boolean
  error: string | null
}

/** Hook générique de fetch avec cache TTL partagé — voir resource-cache.store.ts. */
export function useFetchResource<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs?: number
): UseFetchResourceResult<T> {
  const cached = useResourceCacheStore((s) => s.entries[key]?.data as T | undefined)
  const [loading, setLoading] = useState(cached === undefined)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    fetchCached(key, fetcher, ttlMs)
      .then(() => {
        if (!cancelled) setError(null)
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Erreur de chargement')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
    // key détermine entièrement la ressource demandée ; fetcher ferme sur des
    // identifiants déjà capturés par key, pas besoin de le lister ici.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return { data: cached, loading, error }
}
