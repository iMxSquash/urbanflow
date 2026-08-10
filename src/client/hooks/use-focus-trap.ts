import { useEffect, type RefObject } from 'react'

/**
 * Piège le focus clavier à l'intérieur d'un conteneur (modale, dialogue) et
 * appelle onEscape sur la touche Échap. Focus le premier élément interactif
 * au montage.
 */
export function useFocusTrap(ref: RefObject<HTMLElement | null>, onEscape: () => void) {
  useEffect(() => {
    const container = ref.current
    if (!container) return

    const focusable = container.querySelectorAll<HTMLElement>(
      'button, [href], input, [tabindex]:not([tabindex="-1"])'
    )
    const first = focusable[0]
    const last = focusable[focusable.length - 1]

    first?.focus()

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onEscape()
        return
      }
      if (e.key === 'Tab') {
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last?.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first?.focus()
        }
      }
    }

    container.addEventListener('keydown', onKeyDown)
    return () => container.removeEventListener('keydown', onKeyDown)
  }, [ref, onEscape])
}
