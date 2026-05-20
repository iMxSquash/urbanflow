import { create } from 'zustand'
import {
  getDemoStatus,
  patchDemoMode,
  patchDemoWeather,
  patchProvidersDemo,
} from '../services/demo.service'

interface DemoState {
  demoMode: boolean | null
  providersDemo: boolean | null
  weather: 'sunny' | 'rainy' | null
  loading: boolean
  fetch: () => Promise<void>
  toggle: (enabled: boolean) => Promise<void>
  toggleProviders: (enabled: boolean) => Promise<void>
  setWeather: (weather: 'sunny' | 'rainy') => Promise<void>
}

export const useDemoStore = create<DemoState>((set) => ({
  demoMode: null,
  providersDemo: null,
  weather: null,
  loading: false,

  fetch: async () => {
    try {
      const status = await getDemoStatus()
      set({ demoMode: status.demoMode, providersDemo: status.providersDemo, weather: status.weather })
    } catch {
      set({ demoMode: null, providersDemo: null, weather: null })
    }
  },

  toggle: async (enabled) => {
    set({ loading: true })
    try {
      const status = await patchDemoMode(enabled)
      set({ demoMode: status.demoMode, providersDemo: status.providersDemo })
    } finally {
      set({ loading: false })
    }
  },

  toggleProviders: async (enabled) => {
    set({ loading: true })
    try {
      const status = await patchProvidersDemo(enabled)
      set({ providersDemo: status.providersDemo })
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
