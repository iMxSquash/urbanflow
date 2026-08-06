import { useThemeStore } from '../stores/theme.store'
import { useMediaQuery } from './useMediaQuery'

/** Résout la préférence de thème ('auto' inclus) en booléen sombre/clair,
 * pour le JS qui ne peut pas s'appuyer sur le CSS (ex. choix de tuiles Leaflet). */
export function useIsDarkMode(): boolean {
  const theme = useThemeStore((s) => s.theme)
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)')

  if (theme === 'auto') return prefersDark
  return theme === 'dark'
}
