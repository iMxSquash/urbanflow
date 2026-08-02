import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getUserBadges } from '../services/gamification.service'
import type { BadgeWithStatus } from '../services/gamification.service'
import { BadgeGrid } from '../components/BadgeGrid'
import { useGamificationStore } from '../stores/gamification.store'

/** Écran badges — drill-down depuis « Mes progrès » (MAQUETTE.md §5.4, 3.2 · Badges). */
export default function DashboardBadgesPage() {
  const [badges, setBadges] = useState<BadgeWithStatus[]>([])
  const [loading, setLoading] = useState(true)

  const newlyUnlocked = useGamificationStore((s) => s.newlyUnlockedBadges)
  const clearNewlyUnlocked = useGamificationStore((s) => s.clearNewlyUnlockedBadges)

  useEffect(() => {
    getUserBadges()
      .then(setBadges)
      .catch(() => {
        /* silencieux — badges non critiques */
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (newlyUnlocked.length === 0 || loading) return
    const t = setTimeout(clearNewlyUnlocked, 2000)
    return () => clearTimeout(t)
  }, [newlyUnlocked, loading, clearNewlyUnlocked])

  const unlockedCount = badges.filter((b) => b.unlocked).length

  return (
    <div className="min-h-screen bg-bg">
      <header className="bg-surface border-b border-border sticky top-0 z-navbar">
        <div className="max-w-2xl mx-auto flex items-center gap-3 px-4 h-16">
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

      <main className="max-w-2xl mx-auto px-4 py-4">
        <BadgeGrid badges={badges} newlyUnlocked={newlyUnlocked} loading={loading} />
      </main>
    </div>
  )
}
