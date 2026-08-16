import { useEffect, useEffectEvent, type RefObject } from 'react'

/**
 * Piège le focus clavier à l'intérieur d'un conteneur (modale, dialogue) et
 * appelle onEscape sur la touche Échap. Focus le premier élément interactif
 * au montage. `enabled` (défaut `true`) permet de désactiver le piège sans
 * démonter le hook — utile quand le même conteneur bascule entre dialogue
 * bloquant (mobile) et panneau permanent coexistant avec le reste de la page
 * (desktop), où piéger le focus empêcherait d'atteindre la nav au clavier
 * alors qu'elle reste cliquable et visible.
 */
export function useFocusTrap(
  ref: RefObject<HTMLElement | null>,
  onEscape: () => void,
  enabled = true
) {
  // `useEffectEvent` lit toujours le dernier `onEscape` sans figurer dans les
  // deps de l'effet ci-dessous — un appelant qui passe une closure inline
  // (nouvelle identité à chaque rendu) ne redéclenche donc plus l'effet (et
  // ne vole donc plus le focus) à chaque re-render du conteneur piégé.
  const handleEscape = useEffectEvent(() => {
    onEscape()
  })

  useEffect(() => {
    if (!enabled) return
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
        handleEscape()
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
  }, [ref, enabled])
}
