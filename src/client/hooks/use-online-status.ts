import { useCallback, useEffect, useState } from 'react'

export interface OnlineStatus {
  isOnline: boolean
  /** Relit `navigator.onLine` immédiatement, sans attendre un événement `online`/`offline`. */
  recheck: () => void
}

/** Détection de connectivité réelle via les événements navigateur `online`/`offline`. */
export function useOnlineStatus(): OnlineStatus {
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    function handleOnline() {
      setIsOnline(true)
    }
    function handleOffline() {
      setIsOnline(false)
    }
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const recheck = useCallback(() => {
    setIsOnline(navigator.onLine)
  }, [])

  return { isOnline, recheck }
}
