import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getUserBadges } from '../services/gamification.service'
import { BadgeGrid } from '../components/BadgeGrid'
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
        <header className="bg-surface border-b border-border sticky top-0 z-navbar">
          <div className="max-w-2xl mx-auto flex items-center gap-3 px-4 h-16 lg:max-w-260">
            <Link to="/dashboard" aria-label="Retour aux progrès" className="btn-icon">
              <svg
                aria-hidden="true"
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </Link>
            <h1 className="flex-1 text-h3 font-bold">Badges</h1>
            <span className="text-body-sm font-semibold text-text-muted tabular-nums">
              {loading ? '…' : `${unlockedCount} / ${badges.length}`}
            </span>
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-4 py-4 lg:max-w-260 lg:px-10 lg:py-8">
          <BadgeGrid badges={badges} newlyUnlocked={newlyUnlocked} loading={loading} />
        </main>
      </div>
    </PageWithSidebar>
  )
}
