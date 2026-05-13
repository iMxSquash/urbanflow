import { useCallback, useState } from 'react'
import type { Coordinates } from '@shared/types/index'

interface GeolocationState {
  position: Coordinates | null
  error: string | null
  loading: boolean
}

function toErrorMessage(err: GeolocationPositionError): string {
  switch (err.code) {
    case GeolocationPositionError.PERMISSION_DENIED:
      return 'Accès à la localisation refusé par le navigateur'
    case GeolocationPositionError.POSITION_UNAVAILABLE:
      return 'Position indisponible sur cet appareil'
    case GeolocationPositionError.TIMEOUT:
      return 'Délai dépassé — réessayez'
    default:
      return 'Erreur de localisation'
  }
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    position: null,
    error: null,
    loading: false,
  })

  const locate = useCallback(() => {
    console.log('[geo] locate() appelé')

    if (!navigator.geolocation) {
      console.warn('[geo] navigator.geolocation indisponible')
      setState((s) => ({ ...s, error: 'Géolocalisation non supportée par ce navigateur' }))
      return
    }

    setState({ position: null, error: null, loading: true })
    console.log('[geo] getCurrentPosition lancé')

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        console.log('[geo] position obtenue :', pos.coords.latitude, pos.coords.longitude)
        setState({
          position: { lat: pos.coords.latitude, lng: pos.coords.longitude },
          error: null,
          loading: false,
        })
      },
      (err) => {
        console.warn('[geo] erreur :', err.code, err.message)
        setState({ position: null, error: toErrorMessage(err), loading: false })
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 300_000 }
    )
  }, [])

  return { ...state, locate }
}
