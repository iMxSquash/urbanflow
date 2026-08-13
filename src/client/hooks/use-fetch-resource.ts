import { useCallback, useEffect, useState } from 'react'
import { useResourceCacheStore, fetchCached } from '../stores/resource-cache.store'

interface UseFetchResourceResult<T> {
  data: T | undefined
  loading: boolean
  error: string | null
  refetch: (force?: boolean) => Promise<T>
}

/** Hook générique de fetch avec cache TTL partagé — voir resource-cache.store.ts.
 * `enabled: false` (ex. utilisateur invité) désactive le fetch réseau sans
 * changer la forme du retour — évite un appel authentifié voué au 401. */
export function useFetchResource<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs?: number,
  enabled = true
): UseFetchResourceResult<T> {
  // Cast non vérifiable à l'exécution : le cache est générique sur une clé
  // string, TypeScript ne peut pas relier `key` au `T` de cet appel précis.
  // C'est la même limite structurelle que n'importe quel cache générique par
  // clé (SWR, React Query inclus) — la centralisation des clés dans
  // cache-keys.ts garantit qu'une clé donnée n'a qu'un seul type T possible
  // dans tout le code, ce qui rend ce cast sûr en pratique sans nécessiter de
  // validation runtime.
  const cached = useResourceCacheStore((s) => s.entries[key]?.data as T | undefined)
  const [loadingState, setLoading] = useState(cached === undefined)
  const [error, setError] = useState<string | null>(null)
  const loading = enabled && loadingState

  useEffect(() => {
    if (!enabled) return

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
  }, [key, enabled])

  // Déclenchement manuel (ex. après une action qui invalide la donnée) — ne
  // gère pas loading/error lui-même : l'appelant sait déjà gérer son propre
  // état pour l'action qui déclenche ce refetch (ex. un bouton "Acheter").
  const refetch = useCallback(
    (force = false) => fetchCached(key, fetcher, ttlMs, force),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key, ttlMs]
  )

  // `enabled: false` doit vraiment masquer la donnée, pas seulement sauter le
  // fetch réseau — sans ce filtre, une donnée réelle mise en cache par une
  // session authentifiée précédente resterait lisible via `cached` même après
  // clearAuth() (qui ne vide jamais resource-cache.store), en contradiction
  // avec le docstring de ce hook.
  return { data: enabled ? cached : undefined, loading, error, refetch }
}
