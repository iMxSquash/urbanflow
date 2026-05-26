import { useCallback, useEffect, useRef, useState } from 'react'
import type { Coordinates } from '@shared/types/index'

function haversineM(a: Coordinates, b: Coordinates): number {
  const R = 6_371_000
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const sinDLat = Math.sin(dLat / 2)
  const sinDLng = Math.sin(dLng / 2)
  const x =
    sinDLat * sinDLat +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * sinDLng * sinDLng
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
}

// Slot tagged with the destination it was recorded for. This lets us detect
// whether stored position is from the current session or a stale one.
interface PositionSlot {
  coords: Coordinates
  forDestLat: number
  forDestLng: number
}

interface UseActiveTrackingOptions {
  destination: Coordinates
  active: boolean
  arrivalRadiusM?: number
}

export function useActiveTracking({
  destination,
  active,
  arrivalRadiusM = 100,
}: UseActiveTrackingOptions) {
  const [slot, setSlot] = useState<PositionSlot | null>(null)
  // callbackError is only set from watchPosition callbacks — never in the effect body
  const [callbackError, setCallbackError] = useState<string | null>(null)

  const watchIdRef = useRef<number | null>(null)

  const stop = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!active) {
      stop()
      return
    }

    // If geolocation isn't available, bail without setState — the derived
    // `error` value below surfaces the message without touching effect-time state.
    if (!navigator.geolocation) return

    // Destination is captured via closure: when it changes, the effect re-runs
    // and starts a fresh watchPosition with the new destination.
    const { lat: dLat, lng: dLng } = destination

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const coords: Coordinates = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setSlot({ coords, forDestLat: dLat, forDestLng: dLng })
        setCallbackError(null)
        if (haversineM(coords, { lat: dLat, lng: dLng }) <= arrivalRadiusM) stop()
      },
      (err) => {
        console.warn('[tracking] watchPosition error:', err.code, err.message)
        setCallbackError('Localisation perdue — vérifiez vos réglages GPS')
      },
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 5_000 }
    )

    return stop
  }, [active, destination, arrivalRadiusM, stop])

  // Derived values — no ref.current access during render
  const geolocationUnavailable = typeof navigator !== 'undefined' && !navigator.geolocation

  // Position is "current session" when the stored destination matches the prop.
  const isFreshSlot =
    slot !== null && slot.forDestLat === destination.lat && slot.forDestLng === destination.lng

  const position = isFreshSlot ? slot!.coords : null
  const arrived = active && position !== null && haversineM(position, destination) <= arrivalRadiusM
  const error = active
    ? geolocationUnavailable
      ? 'Géolocalisation non supportée par ce navigateur'
      : callbackError
    : null

  return { position, arrived, error, stop }
}
