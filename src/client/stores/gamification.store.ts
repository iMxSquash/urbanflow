import { create } from 'zustand'
import { useResourceCacheStore } from './resource-cache.store'
import { CACHE_KEYS } from '../constants/cache-keys'

interface GamificationState {
  totalPoints: number
  newlyUnlockedBadges: string[]
  setTripResult: (totalPoints: number, unlockedBadges: string[]) => void
  clearNewlyUnlockedBadges: () => void
}

export const useGamificationStore = create<GamificationState>((set) => ({
  totalPoints: 0,
  newlyUnlockedBadges: [],
  setTripResult: (totalPoints, unlockedBadges) => {
    // Un trajet enregistré peut débloquer un badge ou changer les stats —
    // invalide le cache partagé pour forcer un refetch au prochain accès aux
    // pages Dashboard/Badges plutôt que d'afficher des données périmées.
    useResourceCacheStore.getState().invalidate(CACHE_KEYS.gamificationBadges)
    useResourceCacheStore.getState().invalidate(CACHE_KEYS.gamificationDashboardStats)
    set({ totalPoints, newlyUnlockedBadges: unlockedBadges })
  },
  clearNewlyUnlockedBadges: () => set({ newlyUnlockedBadges: [] }),
}))
