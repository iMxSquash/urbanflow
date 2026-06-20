import { create } from 'zustand'

export type ThemeMode = 'light' | 'dark' | 'auto'

const STORAGE_KEY = 'uf-theme-mode'

function readStored(): ThemeMode {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    if (v === 'light' || v === 'dark' || v === 'auto') return v
  } catch {}
  return 'auto'
}

interface ThemeState {
  themeMode: ThemeMode
  setThemeMode: (mode: ThemeMode) => void
}

export const useThemeStore = create<ThemeState>((set) => ({
  themeMode: readStored(),
  setThemeMode: (mode) => {
    try { localStorage.setItem(STORAGE_KEY, mode) } catch {}
    set({ themeMode: mode })
  },
}))
