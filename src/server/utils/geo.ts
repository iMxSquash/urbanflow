import type { Coordinates } from '@shared/types/index.js'

// 4 décimales ≈ 11 m de précision — suffisant pour le routage, sans exposer la
// position exacte de l'utilisateur aux APIs tierces (RGPD, minimisation).
export function roundCoord(point: Coordinates): Coordinates {
  return {
    lat: Math.round(point.lat * 10_000) / 10_000,
    lng: Math.round(point.lng * 10_000) / 10_000,
  }
}

export function haversineKm(a: Coordinates, b: Coordinates): number {
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLon = ((b.lng - a.lng) * Math.PI) / 180
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
}
