import { useEffect } from 'react'
import { useAuthStore } from '../stores/auth.store'

// Passe par refreshIfNeeded() du store (au lieu d'appeler refreshToken()
// directement) pour dédupliquer avec tout autre déclencheur de refresh dans
// le même onglet (double appel StrictMode, appel concurrent depuis apiFetch)
// — un jti de refresh est à usage unique côté serveur, un doublon perd la
// course et reçoit un 401 legitime.
export function useAuthInit(): boolean {
  const setInitialized = useAuthStore((s) => s.setInitialized)
  const isInitialized = useAuthStore((s) => s.isInitialized)

  useEffect(() => {
    let cancelled = false

    useAuthStore
      .getState()
      .refreshIfNeeded()
      .finally(() => {
        if (!cancelled) setInitialized()
      })

    return () => {
      cancelled = true
    }
  }, [setInitialized])

  return isInitialized
}
