import { describe, expect, it } from 'vitest'
import {
  originReducer,
  resolveOrigin,
  resolveOriginLabel,
  type OriginState,
} from './use-origin-state'

const NANTES_COMMERCE = { lat: 47.218, lng: -1.553 }
const CHANTENAY = { lat: 47.213, lng: -1.588 }

const initial: OriginState = { addressPosition: null, fromLabel: null, geoOverridden: false }

describe('originReducer', () => {
  it('marks a manually selected origin as overriding live GPS', () => {
    const state = originReducer(initial, { type: 'set', coords: CHANTENAY, label: 'Chantenay' })

    // Régression : sélectionner une adresse de départ dans la barre de
    // recherche doit primer sur la position GPS déjà connue, sinon le
    // trajet part toujours de "Ma position" quoi que l'utilisateur tape.
    expect(resolveOrigin(state, NANTES_COMMERCE)).toEqual(CHANTENAY)
    expect(resolveOriginLabel(state, NANTES_COMMERCE)).toBe('Chantenay')
  })

  it('falls back to live GPS position when nothing has been overridden yet', () => {
    expect(resolveOrigin(initial, NANTES_COMMERCE)).toEqual(NANTES_COMMERCE)
    expect(resolveOriginLabel(initial, NANTES_COMMERCE)).toBe('Ma position')
  })

  it('ignores a "set" action with null coords instead of locking out GPS', () => {
    // Régression : `handleSwapDirection` peut dispatcher 'set' avec des
    // coordonnées nulles (inversion avant qu'une arrivée soit choisie) — ça
    // ne doit pas figer l'origine à null en marquant geoOverridden malgré
    // tout, sans quoi le départ resterait bloqué même une fois le GPS dispo.
    const state = originReducer(initial, { type: 'set', coords: null, label: null })

    expect(state).toEqual(initial)
    expect(resolveOrigin(state, NANTES_COMMERCE)).toEqual(NANTES_COMMERCE)
    expect(resolveOriginLabel(state, NANTES_COMMERCE)).toBe('Ma position')
  })

  it('resets back to following live GPS position', () => {
    const overridden = originReducer(initial, {
      type: 'set',
      coords: CHANTENAY,
      label: 'Chantenay',
    })
    const reset = originReducer(overridden, { type: 'reset' })

    expect(resolveOrigin(reset, NANTES_COMMERCE)).toEqual(NANTES_COMMERCE)
    expect(resolveOriginLabel(reset, NANTES_COMMERCE)).toBe('Ma position')
  })
})
