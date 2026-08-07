import { create } from 'zustand'
import { useResourceCacheStore } from './resource-cache.store'

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
    useResourceCacheStore.getState().invalidate('gamification-badges')
    useResourceCacheStore.getState().invalidate('gamification-dashboard-stats')
    set({ totalPoints, newlyUnlockedBadges: unlockedBadges })
  },
  clearNewlyUnlockedBadges: () => set({ newlyUnlockedBadges: [] }),
}))
