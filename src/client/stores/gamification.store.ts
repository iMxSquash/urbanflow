import { create } from 'zustand'

interface GamificationState {
  totalPoints: number
  newlyUnlockedBadges: string[]
  setTripResult: (totalPoints: number, unlockedBadges: string[]) => void
  clearNewlyUnlockedBadges: () => void
}

export const useGamificationStore = create<GamificationState>((set) => ({
  totalPoints: 0,
  newlyUnlockedBadges: [],
  setTripResult: (totalPoints, unlockedBadges) =>
    set({ totalPoints, newlyUnlockedBadges: unlockedBadges }),
  clearNewlyUnlockedBadges: () => set({ newlyUnlockedBadges: [] }),
}))
