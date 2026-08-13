import { useEffect, type DependencyList } from 'react'
import { useAuthStore } from '../stores/auth.store'

/** Effet sauté pour un invité — `action` appelle une route `authGuard`'d (ex.
 * `GET /api/profile`) qu'un invité n'a pas le droit d'atteindre ; un 401 ici
 * déclencherait le `clearAuth()` de l'intercepteur axios, qui réinitialiserait
 * `isGuest` et éjecterait l'invité vers l'état déconnecté. `isGuest` est lu
 * directement dans le store, pas besoin de le passer depuis l'appelant. */
export function useGuestSafeEffect(action: () => unknown, deps: DependencyList): void {
  const isGuest = useAuthStore((s) => s.isGuest)

  useEffect(() => {
    if (isGuest) return
    void action()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, isGuest])
}
