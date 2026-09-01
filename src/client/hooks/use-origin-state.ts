import { useReducer } from 'react'
import type { Coordinates } from '@shared/types/index'

export interface OriginState {
  addressPosition: Coordinates | null
  fromLabel: string | null
  geoOverridden: boolean
}

export type OriginAction =
  | { type: 'set'; coords: Coordinates | null; label: string | null }
  | { type: 'reset' }

const initialOriginState: OriginState = {
  addressPosition: null,
  fromLabel: null,
  geoOverridden: false,
}

// Toute désignation explicite du départ (recherche manuelle, inversion
// départ/arrivée, scénario démo) doit rester prioritaire sur le GPS tant
// qu'aucun reset n'a eu lieu — sans quoi `resolveOrigin` retomberait
// aussitôt sur `geoPosition` dès qu'il est disponible.
export function originReducer(state: OriginState, action: OriginAction): OriginState {
  switch (action.type) {
    case 'set':
      // `coords` peut être null (ex. handleSwapDirection avant qu'une
      // arrivée soit choisie) — ignorer l'action plutôt que de marquer
      // geoOverridden avec une origine vide, ce qui figerait le départ à
      // null même une fois le GPS disponible.
      if (!action.coords) return state
      return { addressPosition: action.coords, fromLabel: action.label, geoOverridden: true }
    case 'reset':
      return initialOriginState
    default:
      return state
  }
}

export function resolveOrigin(
  state: OriginState,
  geoPosition: Coordinates | null
): Coordinates | null {
  return state.geoOverridden ? state.addressPosition : (geoPosition ?? state.addressPosition)
}

export function resolveOriginLabel(
  state: OriginState,
  geoPosition: Coordinates | null
): string | null {
  return state.geoOverridden ? state.fromLabel : geoPosition ? 'Ma position' : state.fromLabel
}

export function useOriginState() {
  return useReducer(originReducer, initialOriginState)
}
