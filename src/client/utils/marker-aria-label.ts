import type L from 'leaflet'

// Assigne aria-label sur le vrai noeud DOM du marqueur (icon container,
// celui qui porte tabindex="0" role="button"), puisque react-leaflet ne
// route jamais `aria-label` vers le DOM lui-même (MarkerProps ne le déclare
// pas, et L.Marker._initIcon ne connaît que `title`/`alt`/`keyboard`). Un
// callback ref plutôt qu'un `useEffect` + lecture de `ref.current` : la
// hook interne de react-leaflet (`useImperativeHandle(forwardedRef, () =>
// instance)`, sans tableau de dépendances, @react-leaflet/core/lib/component.js)
// réinvoque ce callback à CHAQUE rendu du Marker — mais c'est un effet de
// LAYOUT (synchrone, avant paint), qui s'exécute donc AVANT l'effet passif
// `useLayerLifecycle` (@react-leaflet/core/lib/layer.js, plain `useEffect`)
// qui appelle `map.addLayer(instance)` et déclenche `L.Marker._initIcon()` —
// c'est seulement là que `this._icon` (le noeud retourné par getElement())
// est créé, puis que Leaflet fire l'évènement `'add'` (Layer.js : `onAdd()`
// d'abord, `fire('add')` ensuite, donc après `_initIcon()`). Au premier
// rendu d'une instance de marqueur — donc à CHAQUE remount, ce qui inclut
// tout marqueur dont la clé change au pan/zoom via supercluster/decluster —
// le callback ref s'exécute avant que l'icône n'existe : `getElement()`
// renvoie `null`, et un simple `?.setAttribute(...)` s'éteint silencieusement
// sans jamais poser le label. D'où le fallback ci-dessous : si l'icône n'est
// pas encore là, on s'abonne une fois à l'évènement `'add'` du marqueur
// (`once`, pas `on` : auto-désinscription après le premier déclenchement,
// pas besoin d'`off` manuel) pour poser le label dès que `_initIcon()` a
// tourné.
export function markerAriaLabelRef(label: string) {
  return (marker: L.Marker | null) => {
    if (!marker) return
    const el = marker.getElement()
    if (el) {
      el.setAttribute('aria-label', label)
    } else {
      marker.once('add', () => marker.getElement()?.setAttribute('aria-label', label))
    }
  }
}
