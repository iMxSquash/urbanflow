import { useEffect } from 'react'
import { useThemeStore, type ThemeMode } from '../stores/theme.store'

function resolveTheme(mode: ThemeMode): 'light' | 'dark' {
  if (mode !== 'auto') return mode
  const h = new Date().getHours()
  return h >= 20 || h < 7 ? 'dark' : 'light'
}

export function useThemeSync() {
  const themeMode = useThemeStore((s) => s.themeMode)

  useEffect(() => {
    function apply() {
      document.documentElement.dataset.theme = resolveTheme(themeMode)
    }

    apply()

    if (themeMode !== 'auto') return
    const id = setInterval(apply, 60_000)
    return () => clearInterval(id)
  }, [themeMode])
}
