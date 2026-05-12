import { create } from 'zustand'
import { getProfile, putProfile } from '../services/profile.service'
import type { MobilityProfile, UpdateProfileInput } from '@shared/types/index'

interface ProfileState {
  profile: MobilityProfile | null
  isLoading: boolean
  error: string | null
  fetchProfile: () => Promise<void>
  updateProfile: (data: UpdateProfileInput) => Promise<void>
  clearProfile: () => void
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: null,
  isLoading: false,
  error: null,

  fetchProfile: async () => {
    if (get().profile !== null) return
    set({ isLoading: true, error: null })
    try {
      const profile = await getProfile()
      set({ profile, isLoading: false })
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false })
    }
  },

  updateProfile: async (data) => {
    set({ isLoading: true, error: null })
    try {
      const profile = await putProfile(data)
      set({ profile, isLoading: false })
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false })
      throw err
    }
  },

  clearProfile: () => set({ profile: null, error: null }),
}))
