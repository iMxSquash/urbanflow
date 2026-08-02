import { lazy, Suspense, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getDashboardStats, getUserBadges } from '../services/gamification.service'
import type { BadgeWithStatus, DashboardStats } from '../services/gamification.service'
import { BottomNav } from '../components/BottomNav'

const WeeklyCo2Chart = lazy(() => import('../components/WeeklyCo2Chart'))
const ModeBreakdownTable = lazy(() => import('../components/ModeBreakdownTable'))

function formatCo2Kg(grams: number): string {
  return `${(grams / 1000).toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} kg`
}

function ChartSkeleton({ height = 'h-27' }: { height?: string }) {
  return (
    <div className={`${height} flex items-center justify-center`} aria-hidden="true">
      <div className="skeleton w-full h-full rounded-lg" />
    </div>
  )
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [badges, setBadges] = useState<BadgeWithStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([getDashboardStats(), getUserBadges()])
      .then(([s, b]) => {
        setStats(s)
        setBadges(b)
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Erreur de chargement')
      })
      .finally(() => setLoading(false))
  }, [])

  const now = new Date()
  const monthLabel = now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
  const unlockedCount = badges.filter((b) => b.unlocked).length

  return (
    <div className="min-h-screen bg-bg pb-[calc(var(--height-bottomnav)+1rem)] lg:pb-6">
      <header className="bg-primary px-5 pt-4.5 pb-5 flex flex-col gap-3.5">
        <div className="flex items-center justify-between">
          <h1 className="text-h3 font-bold text-on-primary">Mes progrès</h1>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-on-primary/15 text-caption font-semibold text-on-primary capitalize">
            {monthLabel}
          </span>
        </div>
        <div className="flex items-end gap-4">
          <span className="flex flex-col">
            <span className="text-caption text-on-primary-muted">Points</span>
            <span className="text-[38px] font-bold text-on-primary leading-none tracking-[-0.03em] tabular-nums">
              {loading || !stats ? '—' : stats.summary.totalPoints.toLocaleString('fr-FR')}
            </span>
          </span>
          <span className="flex flex-col pb-0.5">
            <span className="text-caption text-on-primary-muted">CO₂ évité ce mois</span>
            <span className="text-h2 font-bold text-on-primary leading-tight tabular-nums">
              {loading || !stats ? '—' : formatCo2Kg(stats.summary.co2SavedGrams)}
            </span>
          </span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-4 flex flex-col gap-3.5">
        {error && (
          <div role="alert" className="bg-danger-surface rounded-xl px-4 py-3 text-danger-text text-body-sm">
            {error}
          </div>
        )}

        <section className="card p-3.5" aria-labelledby="weekly-heading">
          <div className="flex items-baseline justify-between mb-3">
            <h2 id="weekly-heading" className="text-body-lg font-bold">
              CO₂ évité par semaine
            </h2>
            <span className="text-caption text-text-muted">en kg</span>
          </div>
          {loading ? (
            <ChartSkeleton />
          ) : stats ? (
            <Suspense fallback={<ChartSkeleton />}>
              <WeeklyCo2Chart data={stats.weeklyCo2} />
            </Suspense>
          ) : null}
        </section>

        <section className="card p-3.5" aria-labelledby="modes-heading">
          <h2 id="modes-heading" className="text-body-lg font-bold mb-2.5">
            Répartition par mode
          </h2>
          {loading ? (
            <ChartSkeleton height="h-40" />
          ) : stats ? (
            <Suspense fallback={<ChartSkeleton height="h-40" />}>
              <ModeBreakdownTable data={stats.modeBreakdown} />
            </Suspense>
          ) : null}
        </section>

        <Link
          to="/dashboard/badges"
          className="card p-3.5 flex items-center gap-3 no-underline hover:bg-surface-muted transition-colors duration-fast"
        >
          <svg
            aria-hidden="true"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-primary shrink-0"
          >
            <polyline points="8 21 12 17 16 21" />
            <line x1="12" y1="17" x2="12" y2="11" />
            <path d="M7 4H4a2 2 0 0 0-2 2v1c0 4 3 7 6 8" />
            <path d="M17 4h3a2 2 0 0 1 2 2v1c0 4-3 7-6 8" />
            <rect x="7" y="2" width="10" height="9" rx="1" />
          </svg>
          <span className="flex-1 text-body-sm font-semibold">Mes badges</span>
          <span className="text-caption text-text-muted tabular-nums">
            {loading ? '…' : `${unlockedCount} / ${badges.length}`}
          </span>
          <svg
            aria-hidden="true"
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-text-muted shrink-0"
          >
            <path d="M9 6l6 6-6 6" />
          </svg>
        </Link>

        <p className="text-caption text-text-subtle leading-relaxed">
          Facteurs d'émission : Base Empreinte ADEME — voiture 253 g/km, bus 109, tramway 4, navibus 50,
          train 14, vélo · marche · trottinette 0 g/km. Calcul déterministe, sans estimation automatique.
        </p>
      </main>

      <BottomNav />
    </div>
  )
}
