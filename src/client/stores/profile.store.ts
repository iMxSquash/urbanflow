import { create } from 'zustand'
import { getProfile, putProfile } from '../services/profile.service'
import { fetchCached, useResourceCacheStore } from './resource-cache.store'
import { CACHE_KEYS, CACHE_TTL_MS } from '../constants/cache-keys'
import type { MobilityProfile, UpdateProfileInput } from '@shared/types/index'

interface ProfileState {
  profile: MobilityProfile | null
  isLoading: boolean
  error: string | null
  fetchProfile: () => Promise<void>
  updateProfile: (data: UpdateProfileInput) => Promise<void>
  clearProfile: () => void
}

export const useProfileStore = create<ProfileState>((set) => ({
  profile: null,
  isLoading: false,
  error: null,

  fetchProfile: async () => {
    set({ isLoading: true, error: null })
    try {
      const profile = await fetchCached(CACHE_KEYS.profile, getProfile, CACHE_TTL_MS.profile)
      set({ profile, isLoading: false })
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false })
    }
  },

  updateProfile: async (data) => {
    set({ isLoading: true, error: null })
    try {
      const profile = await putProfile(data)
      // Modifiable depuis ProfilePage ou l'onboarding — les deux passent par
      // cette action, donc invalider ici couvre les deux origines.
      useResourceCacheStore.getState().invalidate(CACHE_KEYS.profile)
      set({ profile, isLoading: false })
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false })
      throw err
    }
  },

  clearProfile: () => {
    // Logout/suppression de compte : évite qu'une session suivante (même
    // onglet, ré-authentification) lise le profil de l'utilisateur précédent
    // depuis le cache partagé.
    useResourceCacheStore.getState().invalidate(CACHE_KEYS.profile)
    set({ profile: null, error: null })
  },
}))
