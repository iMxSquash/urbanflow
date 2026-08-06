import { useEffect } from 'react'
import { useMap } from 'react-leaflet'

/** Leaflet ne redétecte que les redimensionnements de `window` (option
 * `trackResize`), jamais ceux de son propre conteneur — qui change pourtant
 * de largeur quand le panneau desktop se réduit/s'agrandit (`.bottom-sheet`,
 * index.css). Sans resync, la zone nouvellement révélée reste sans tuiles
 * chargées et les calculs de pixel restent basés sur l'ancienne taille. */
export function MapResizeSync() {
  const map = useMap()

  useEffect(() => {
    const observer = new ResizeObserver(() => {
      map.invalidateSize()
    })
    observer.observe(map.getContainer())
    return () => observer.disconnect()
  }, [map])

  return null
}
