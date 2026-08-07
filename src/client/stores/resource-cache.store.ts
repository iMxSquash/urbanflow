import { create } from 'zustand'

interface CacheEntry {
  data: unknown
  fetchedAt: number
}

interface ResourceCacheState {
  entries: Record<string, CacheEntry>
  setEntry: (key: string, data: unknown) => void
  invalidate: (key: string) => void
}

export const useResourceCacheStore = create<ResourceCacheState>((set) => ({
  entries: {},
  setEntry: (key, data) =>
    set((s) => ({ entries: { ...s.entries, [key]: { data, fetchedAt: Date.now() } } })),
  invalidate: (key) =>
    set((s) => {
      if (!(key in s.entries)) return s
      const entries = { ...s.entries }
      delete entries[key]
      return { entries }
    }),
}))

const DEFAULT_TTL_MS = 5 * 60 * 1000
const pendingFetches = new Map<string, Promise<unknown>>()

/**
 * Cache mémoire partagé avec TTL + dédup des appels concurrents sur une même
 * clé — évite de refetch à chaque remount de composant/page (éco-conception,
 * limite la pression sur le rate limit global côté serveur).
 *
 * Ne supporte pas l'annulation à l'unmount par design : une requête partagée
 * doit pouvoir bénéficier à un autre abonné même si le composant qui l'a
 * déclenchée en premier est démonté avant la réponse.
 */
export async function fetchCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs: number = DEFAULT_TTL_MS,
  force = false
): Promise<T> {
  const cached = useResourceCacheStore.getState().entries[key]
  if (!force && cached && Date.now() - cached.fetchedAt < ttlMs) {
    // Cast non vérifiable au runtime, cf. le commentaire équivalent dans
    // useFetchResource.ts — sûr en pratique car les clés sont centralisées
    // dans cache-keys.ts (une clé → un seul T possible dans tout le code).
    return cached.data as T
  }

  const existing = pendingFetches.get(key)
  if (existing) return existing as Promise<T>

  const promise = fetcher()
    .then((data) => {
      useResourceCacheStore.getState().setEntry(key, data)
      return data
    })
    .finally(() => {
      pendingFetches.delete(key)
    })

  pendingFetches.set(key, promise)
  return promise
}
