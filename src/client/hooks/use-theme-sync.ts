import { useEffect } from 'react'
import { useThemeStore } from '../stores/theme.store'

/** Applique la préférence de thème sur `<html data-theme>`. 'auto' retire
 * l'attribut : le CSS retombe sur `prefers-color-scheme` (déjà géré dans index.css). */
export function useThemeSync() {
  const theme = useThemeStore((s) => s.theme)

  useEffect(() => {
    if (theme === 'auto') {
      document.documentElement.removeAttribute('data-theme')
    } else {
      document.documentElement.setAttribute('data-theme', theme)
    }
  }, [theme])
}
