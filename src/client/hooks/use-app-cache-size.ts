import { useEffect, useState } from 'react'
import { formatMegabytes } from '../utils/format-bytes'

/** Taille réelle de l'app mise en cache hors-ligne, lue via l'API Storage du
 * navigateur plutôt qu'une valeur figée dans le code — suit automatiquement la
 * taille du build sans mise à jour manuelle. `serviceWorker.ready` ne se résout
 * qu'une fois le SW actif ; Workbox bloque l'activation sur la fin du precache
 * (event `install`), donc à ce stade le cache est déjà rempli. */
export function useAppCacheSize(): string | null {
  const [sizeLabel, setSizeLabel] = useState<string | null>(null)

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !navigator.storage?.estimate) return

    let cancelled = false
    navigator.serviceWorker.ready
      .then(() => navigator.storage.estimate())
      .then((estimate) => {
        if (cancelled || !estimate.usage) return
        setSizeLabel(formatMegabytes(estimate.usage))
      })
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [])

  return sizeLabel
}
