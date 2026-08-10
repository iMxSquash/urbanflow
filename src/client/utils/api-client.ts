import { useAuthStore } from '../stores/auth.store'

/**
 * Wrapper fetch pour toutes les routes API protégées.
 * Attache automatiquement le Bearer token, et sur 401 :
 *   1. délègue au store (refreshIfNeeded) qui déduplique les appels concurrent
 *   2. relance la requête avec le nouveau token
 *   3. si le refresh échoue, déconnecte l'utilisateur via clearAuth()
 *
 * Ne pas utiliser pour les appels auth (login, register, logout, refresh)
 * qui gèrent eux-mêmes les cookies et ne nécessitent pas de Bearer.
 */
export async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const { accessToken, clearAuth } = useAuthStore.getState()

  const headers = new Headers(init?.headers)
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`)
  }

  const res = await fetch(input, { ...init, headers, credentials: 'include' })

  if (res.status !== 401) {
    return res
  }

  // 401 — délègue la déduplication et la mise à jour du store à refreshIfNeeded
  const newToken = await useAuthStore.getState().refreshIfNeeded()

  if (!newToken) {
    // Refresh échoué — ProtectedRoute voit accessToken = null et redirige vers /login
    clearAuth()
    return res
  }

  const retryHeaders = new Headers(init?.headers)
  retryHeaders.set('Authorization', `Bearer ${newToken}`)

  return fetch(input, { ...init, headers: retryHeaders, credentials: 'include' })
}

/**
 * Parse la réponse JSON d'un appel API et lève une erreur lisible sur échec.
 * `res.json()` est protégé par un `catch` : un corps d'erreur non-JSON (ex.
 * page HTML par défaut) tombe sur `fallbackMessage` au lieu de faire échouer
 * le parsing lui-même.
 */
export async function parseJsonResponse<T = unknown>(
  res: Response,
  fallbackMessage: string
): Promise<T> {
  const data: unknown = await res.json().catch(() => null)

  if (!res.ok) {
    const err = data as { error?: string } | null
    throw new Error(err?.error ?? fallbackMessage)
  }

  return data as T
}
