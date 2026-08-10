import { useEffect } from 'react'
import { getUserBadges } from '../services/gamification.service'
import { BackButton } from '../components/BackButton'
import { BadgeGrid } from '../components/BadgeGrid'
import { PageHeader } from '../components/PageHeader'
import { PageWithSidebar } from '../components/PageWithSidebar'
import { useGamificationStore } from '../stores/gamification.store'
import { useFetchResource } from '../hooks/useFetchResource'
import { CACHE_KEYS, CACHE_TTL_MS } from '../constants/cache-keys'

/** Écran badges — drill-down depuis « Mes progrès » (MAQUETTE.md §5.4, 3.2 · Badges). */
export default function DashboardBadgesPage() {
  const { data: badgesData, loading } = useFetchResource(
    CACHE_KEYS.gamificationBadges,
    getUserBadges,
    CACHE_TTL_MS.gamificationBadges
  )
  const badges = badgesData ?? []

  const newlyUnlocked = useGamificationStore((s) => s.newlyUnlockedBadges)
  const clearNewlyUnlocked = useGamificationStore((s) => s.clearNewlyUnlockedBadges)

  useEffect(() => {
    if (newlyUnlocked.length === 0 || loading) return
    const t = setTimeout(clearNewlyUnlocked, 2000)
    return () => clearTimeout(t)
  }, [newlyUnlocked, loading, clearNewlyUnlocked])

  const unlockedCount = badges.filter((b) => b.unlocked).length

  return (
    <PageWithSidebar>
      <div className="min-h-screen bg-bg">
        <PageHeader>
          <div className="max-w-2xl mx-auto flex items-center gap-3 px-4 h-16 lg:max-w-260">
            <BackButton to="/dashboard" aria-label="Retour aux progrès" />
            <h1 className="flex-1 text-h3 font-bold">Badges</h1>
            <span className="text-body-sm font-semibold text-text-muted tabular-nums">
              {loading ? '…' : `${unlockedCount} / ${badges.length}`}
            </span>
          </div>
        </PageHeader>

        <main className="max-w-2xl mx-auto px-4 py-4 lg:max-w-260 lg:px-10 lg:py-8">
          <BadgeGrid badges={badges} newlyUnlocked={newlyUnlocked} loading={loading} />
        </main>
      </div>
    </PageWithSidebar>
  )
}
