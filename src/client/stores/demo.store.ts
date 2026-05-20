import { create } from 'zustand'
import { getDemoStatus, patchDemoMode } from '../services/demo.service'

interface DemoState {
  demoMode: boolean | null
  loading: boolean
  fetch: () => Promise<void>
  toggle: (enabled: boolean) => Promise<void>
}

export const useDemoStore = create<DemoState>((set) => ({
  demoMode: null,
  loading: false,

  fetch: async () => {
    try {
      const status = await getDemoStatus()
      set({ demoMode: status.demoMode })
    } catch {
      set({ demoMode: null })
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
}))
