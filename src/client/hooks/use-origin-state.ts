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
export function originReducer(_state: OriginState, action: OriginAction): OriginState {
  switch (action.type) {
    case 'set':
      return { addressPosition: action.coords, fromLabel: action.label, geoOverridden: true }
    case 'reset':
      return initialOriginState
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
