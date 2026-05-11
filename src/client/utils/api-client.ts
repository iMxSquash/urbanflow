import { useAuthStore } from '../stores/auth.store'
import { refreshToken } from '../services/auth.service'

// Déduplication : si plusieurs requêtes reçoivent un 401 simultanément,
// une seule tentative de refresh est effectuée — les autres attendent.
let pendingRefresh: Promise<string | null> | null = null

async function getNewAccessToken(): Promise<string | null> {
  if (!pendingRefresh) {
    pendingRefresh = refreshToken()
      .then((data) => data?.accessToken ?? null)
      .finally(() => {
        pendingRefresh = null
      })
  }
  return pendingRefresh
}

/**
 * Wrapper fetch pour toutes les routes API protégées.
 * Attache automatiquement le Bearer token, et sur 401 :
 *   1. tente un refresh silencieux
 *   2. relance la requête avec le nouveau token
 *   3. si le refresh échoue, déconnecte l'utilisateur
 *
 * Ne pas utiliser pour les appels auth (login, register, logout, refresh)
 * qui gèrent eux-mêmes les cookies et ne nécessitent pas de Bearer.
 */
export async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const { accessToken, setAuth, clearAuth } = useAuthStore.getState()

  const headers = new Headers(init?.headers)
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`)
  }

  const res = await fetch(input, { ...init, headers, credentials: 'include' })

  if (res.status !== 401) {
    return res
  }

  // 401 — tentative de refresh silencieux
  const newToken = await getNewAccessToken()

  if (!newToken) {
    // Refresh échoué (cookie absent ou expiré) — on déconnecte.
    // ProtectedRoute voit accessToken = null et redirige vers /login.
    clearAuth()
    return res
  }

  // Nouveau token obtenu — mise à jour du store et retry unique
  setAuth(newToken)

  const retryHeaders = new Headers(init?.headers)
  retryHeaders.set('Authorization', `Bearer ${newToken}`)

  return fetch(input, { ...init, headers: retryHeaders, credentials: 'include' })
}
