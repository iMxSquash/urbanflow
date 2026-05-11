import { useEffect } from 'react'
import { refreshToken } from '../services/auth.service'
import { useAuthStore } from '../stores/auth.store'

export function useAuthInit(): boolean {
  const setAuth = useAuthStore((s) => s.setAuth)
  const setInitialized = useAuthStore((s) => s.setInitialized)
  const isInitialized = useAuthStore((s) => s.isInitialized)

  useEffect(() => {
    const controller = new AbortController()

    refreshToken(controller.signal)
      .then((data) => {
        if (data) setAuth(data.accessToken)
      })
      .catch((err: unknown) => {
        if (err instanceof Error && err.name === 'AbortError') return
        // Pas de cookie ou cookie expiré — l'utilisateur reste déconnecté
      })
      .finally(() => {
        if (!controller.signal.aborted) setInitialized()
      })

    return () => controller.abort()
  }, [setAuth, setInitialized])

  return isInitialized
}
