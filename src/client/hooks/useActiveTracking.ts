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

// Poll interval and movement threshold — tuned for battery/eco efficiency:
// - Network triangulation (no GPS chip) every 20 s
// - Only trigger re-renders when the user has actually moved > 5 m
const POLL_INTERVAL_MS = 20_000
const MIN_MOVE_M = 5

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
  const [callbackError, setCallbackError] = useState<string | null>(null)

  const intervalIdRef = useRef<ReturnType<typeof setInterval> | null>(null)
  // Prevents concurrent getCurrentPosition calls if a fix takes longer than the interval
  const pendingRef = useRef(false)

  const stop = useCallback(() => {
    if (intervalIdRef.current !== null) {
      clearInterval(intervalIdRef.current)
      intervalIdRef.current = null
    }
    pendingRef.current = false
  }, [])

  useEffect(() => {
    if (!active) {
      stop()
      return
    }

    if (!navigator.geolocation) return

    const { lat: dLat, lng: dLng } = destination

    function fetchPosition() {
      if (pendingRef.current) return
      pendingRef.current = true

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          pendingRef.current = false
          const coords: Coordinates = { lat: pos.coords.latitude, lng: pos.coords.longitude }

          // Skip state update (and map re-render) if user barely moved
          setSlot((prev) => {
            if (
              prev !== null &&
              prev.forDestLat === dLat &&
              prev.forDestLng === dLng &&
              haversineM(prev.coords, coords) < MIN_MOVE_M
            ) {
              return prev
            }
            return { coords, forDestLat: dLat, forDestLng: dLng }
          })

          setCallbackError(null)
          if (haversineM(coords, { lat: dLat, lng: dLng }) <= arrivalRadiusM) stop()
        },
        (err) => {
          pendingRef.current = false
          console.warn('[tracking] getCurrentPosition error:', err.code, err.message)
          setCallbackError('Localisation perdue — vérifiez vos réglages GPS')
        },
        // enableHighAccuracy: false → network/WiFi triangulation, no GPS chip
        // maximumAge: 0 → always a fresh fix per poll (network triangulation is fast)
        { enableHighAccuracy: false, timeout: 10_000, maximumAge: 0 }
      )
    }

    fetchPosition() // immediate first fix on tracking start
    intervalIdRef.current = setInterval(fetchPosition, POLL_INTERVAL_MS)

    return stop
  }, [active, destination, arrivalRadiusM, stop])

  // Derived values — no ref.current access during render
  const geolocationUnavailable = typeof navigator !== 'undefined' && !navigator.geolocation

  const isFreshSlot =
    slot !== null &&
    slot.forDestLat === destination.lat &&
    slot.forDestLng === destination.lng

  const position = isFreshSlot ? slot!.coords : null
  const arrived = active && position !== null && haversineM(position, destination) <= arrivalRadiusM
  const error = active
    ? geolocationUnavailable
      ? 'Géolocalisation non supportée par ce navigateur'
      : callbackError
    : null

  return { position, arrived, error, stop }
}
