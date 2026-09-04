import { describe, expect, it, vi } from 'vitest'
import type L from 'leaflet'
import { markerAriaLabelRef } from './marker-aria-label'

// Fake minimal, sans dépendre du vrai module `leaflet` — `leaflet` référence
// `window`/`document`/`navigator` au chargement (cf. leaflet/src/core/
// Browser.js) et suppose donc un environnement DOM que les tests de ce repo
// n'installent pas (Vitest tourne en environnement Node par défaut ici, cf.
// use-origin-state.test.ts). `marker-aria-label.ts` n'importe `L` qu'en
// type-only (`import type`, erasé à la compilation) précisément pour rester
// testable sans DOM ; on ne modélise donc ici que le sous-ensemble d'API
// réellement utilisé par `markerAriaLabelRef` : `getElement()` et `once()`.
function createFakeMarker(initialElement: { setAttribute: ReturnType<typeof vi.fn> } | null) {
  let element = initialElement
  let addListener: (() => void) | null = null

  const marker = {
    getElement: () => element,
    once: (event: string, handler: () => void) => {
      if (event === 'add') addListener = handler
      return marker
    },
    // Simule Layer.js : `onAdd()` (donc `_initIcon()`, qui pose l'icône)
    // tourne avant `fire('add')` — l'ordre réel que le fix exploite.
    simulateLeafletAdd(newElement: { setAttribute: ReturnType<typeof vi.fn> }) {
      element = newElement
      addListener?.()
    },
  }

  return marker as unknown as L.Marker & {
    simulateLeafletAdd: (el: { setAttribute: ReturnType<typeof vi.fn> }) => void
  }
}

describe('markerAriaLabelRef', () => {
  it('ignore une ref null (démontage) sans lever', () => {
    expect(() => markerAriaLabelRef('label')(null)).not.toThrow()
  })

  it('pose aria-label immédiatement quand le noeud icône existe déjà', () => {
    const icon = { setAttribute: vi.fn() }
    const marker = createFakeMarker(icon)

    markerAriaLabelRef('Station Bicloo Test — 3 vélos disponibles')(marker)

    expect(icon.setAttribute).toHaveBeenCalledWith(
      'aria-label',
      'Station Bicloo Test — 3 vélos disponibles'
    )
  })

  it(
    'régression : quand getElement() renvoie null au moment du callback ref ' +
      "(layout effect useImperativeHandle avant l'effet passif useLayerLifecycle " +
      "qui déclenche _initIcon()), le label est posé dès que Leaflet fire 'add' " +
      'au lieu de ne jamais être posé — reproduit le remount de marqueur causé ' +
      'par un changement de clé de cluster au zoom/pan',
    () => {
      const marker = createFakeMarker(null)

      // Comme au premier rendu réel d'un Marker (et donc à chaque remount
      // provoqué par un changement de clé de cluster au zoom/pan) :
      // getElement() est encore null quand ce callback ref s'exécute.
      markerAriaLabelRef('Station Bicloo Test — 3 vélos disponibles')(marker)

      // Rien à poser tant que l'icône n'existe pas — mais surtout, pas de
      // crash silencieux qui abandonnerait le label pour de bon (c'était le
      // bug : `marker?.getElement()?.setAttribute(...)` s'éteignait ici sans
      // jamais réessayer).
      const icon = { setAttribute: vi.fn() }
      expect(icon.setAttribute).not.toHaveBeenCalled()

      // Leaflet attache enfin l'icône puis fire 'add' (ordre réel de
      // Layer.js : onAdd() d'abord, fire('add') ensuite).
      marker.simulateLeafletAdd(icon)

      expect(icon.setAttribute).toHaveBeenCalledWith(
        'aria-label',
        'Station Bicloo Test — 3 vélos disponibles'
      )
    }
  )
})
