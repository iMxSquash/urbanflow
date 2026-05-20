import { create } from 'zustand'
import { getDemoStatus, patchDemoMode, patchDemoWeather } from '../services/demo.service'

interface DemoState {
  demoMode: boolean | null
  weather: 'sunny' | 'rainy' | null
  loading: boolean
  fetch: () => Promise<void>
  toggle: (enabled: boolean) => Promise<void>
  setWeather: (weather: 'sunny' | 'rainy') => Promise<void>
}

export const useDemoStore = create<DemoState>((set) => ({
  demoMode: null,
  weather: null,
  loading: false,

  fetch: async () => {
    try {
      const status = await getDemoStatus()
      set({ demoMode: status.demoMode, weather: status.weather })
    } catch {
      set({ demoMode: null, weather: null })
    }
  },

  toggle: async (enabled) => {
    set({ loading: true })
    try {
      await patchDemoMode(enabled)
      set({ demoMode: enabled })
    } finally {
      set({ loading: false })
    }
  },

  setWeather: async (weather) => {
    set({ loading: true })
    try {
      await patchDemoWeather(weather)
      set({ weather })
    } finally {
      set({ loading: false })
    }
  },
}))
