import { lazy, Suspense, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getDashboardStats, getUserBadges } from '../services/gamification.service'
import { BadgeGrid } from '../components/BadgeGrid'
import { Co2FactorsNote } from '../components/Co2FactorsNote'
import { GuestLocked } from '../components/GuestLocked'
import { PageWithSidebar } from '../components/PageWithSidebar'
import { useAuthStore } from '../stores/auth.store'
import { useGamificationStore } from '../stores/gamification.store'
import { useFetchResource } from '../hooks/use-fetch-resource'
import { CACHE_KEYS, CACHE_TTL_MS } from '../constants/cache-keys'
import { GUEST_FAKE_BADGES, GUEST_FAKE_STATS } from '../constants/guest-fake-data'

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

function KpiTile({
  label,
  value,
  loading,
  emphasis = false,
}: {
  label: string
  value: string
  loading: boolean
  emphasis?: boolean
}) {
  return (
    <div
      className={
        emphasis
          ? 'rounded-xl p-4 flex flex-col gap-1 bg-primary text-on-primary'
          : 'card rounded-xl p-4 flex flex-col gap-1'
      }
    >
      <span
        className={emphasis ? 'text-caption text-on-primary-muted' : 'text-caption text-text-muted'}
      >
        {label}
      </span>
      <span className="text-h1 font-bold tabular-nums leading-none">{loading ? '—' : value}</span>
    </div>
  )
}

export default function DashboardPage() {
  const isGuest = useAuthStore((s) => s.isGuest)

  const {
    data: statsData,
    loading: statsLoading,
    error: statsError,
  } = useFetchResource(
    CACHE_KEYS.gamificationDashboardStats,
    getDashboardStats,
    CACHE_TTL_MS.gamificationDashboardStats,
    !isGuest
  )
  const {
    data: badgesData,
    loading: badgesLoading,
    error: badgesError,
  } = useFetchResource(
    CACHE_KEYS.gamificationBadges,
    getUserBadges,
    CACHE_TTL_MS.gamificationBadges,
    !isGuest
  )

  const stats = isGuest ? GUEST_FAKE_STATS : statsData
  const badges = isGuest ? GUEST_FAKE_BADGES : (badgesData ?? [])
  const loading = statsLoading || badgesLoading
  const error = statsError ?? badgesError

  const newlyUnlocked = useGamificationStore((s) => s.newlyUnlockedBadges)
  const clearNewlyUnlocked = useGamificationStore((s) => s.clearNewlyUnlockedBadges)

  useEffect(() => {
    if (newlyUnlocked.length === 0 || loading) return
    const t = setTimeout(clearNewlyUnlocked, 2000)
    return () => clearTimeout(t)
  }, [newlyUnlocked, loading, clearNewlyUnlocked])

  const now = new Date()
  const monthLabel = now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
  const unlockedCount = badges.filter((b) => b.unlocked).length

  return (
    <PageWithSidebar>
      <div className="min-h-dvh bg-bg pb-[calc(var(--height-bottomnav)+1rem)] lg:pb-6">
        {/* ── Mobile : header + cartes empilées ─────────────────────────── */}
        <div className="lg:hidden">
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
              <div
                role="alert"
                className="bg-danger-surface rounded-xl px-4 py-3 text-danger-text text-body-sm"
              >
                {error}
              </div>
            )}

            <GuestLocked
              active={isGuest}
              title="Créez un compte pour suivre vos progrès"
              description="Connectez-vous ou créez un compte gratuitement pour suivre vos points et débloquer des badges."
            >
              <div className="flex flex-col gap-3.5">
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

                <Co2FactorsNote />
              </div>
            </GuestLocked>
          </main>
        </div>

        {/* ── Desktop ≥1024px : résumé + badges fusionnés, 4 tuiles KPI ───
         * MAQUETTE.md §5.4 : "les deux écrans mobiles fusionnent : plus de
         * navigation intermédiaire". Pas de colonne "CO₂ émis" dans le tableau
         * de répartition : nécessiterait une donnée par mode non persistée côté
         * serveur (trips stocke un total par trajet, pas par segment/mode) —
         * omis plutôt que fabriqué, cf. MIGRATION-TODO.md. */}
        <main className="hidden lg:flex lg:flex-col max-w-260 mx-auto px-10 py-8">
          <div className="flex items-baseline justify-between mb-5">
            <h1 className="text-h1 font-bold text-text">Mes progrès</h1>
            <span className="text-body-sm text-text-muted capitalize">{monthLabel}</span>
          </div>

          {error && (
            <div
              role="alert"
              className="bg-danger-surface rounded-xl px-4 py-3 text-danger-text text-body-sm mb-5"
            >
              {error}
            </div>
          )}

          <GuestLocked
            active={isGuest}
            title="Créez un compte pour suivre vos progrès"
            description="Connectez-vous ou créez un compte gratuitement pour suivre vos points et débloquer des badges."
          >
            <div className="grid grid-cols-4 gap-3.5 mb-5">
              <KpiTile
                label="Points"
                value={stats ? stats.summary.totalPoints.toLocaleString('fr-FR') : '—'}
                loading={loading}
                emphasis
              />
              <KpiTile
                label="CO₂ évité ce mois"
                value={stats ? formatCo2Kg(stats.summary.co2SavedGrams) : '—'}
                loading={loading}
              />
              <KpiTile
                label="Trajets terminés"
                value={stats ? String(stats.summary.tripCount) : '—'}
                loading={loading}
              />
              <KpiTile
                label="Badges"
                value={`${unlockedCount} / ${badges.length}`}
                loading={loading}
              />
            </div>

            <div className="grid grid-cols-[1.35fr_1fr] gap-5">
              <div className="flex flex-col gap-5">
                <section className="card p-4" aria-labelledby="weekly-heading-lg">
                  <div className="flex items-baseline justify-between mb-3">
                    <h2 id="weekly-heading-lg" className="text-body-lg font-bold">
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

                <section className="card p-4" aria-labelledby="modes-heading-lg">
                  <h2 id="modes-heading-lg" className="text-body-lg font-bold mb-2.5">
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
              </div>

              <section className="card p-4" aria-labelledby="badges-heading-lg">
                <h2 id="badges-heading-lg" className="text-body-lg font-bold mb-3">
                  Badges
                </h2>
                <BadgeGrid badges={badges} newlyUnlocked={newlyUnlocked} loading={loading} />
              </section>
            </div>

            <Co2FactorsNote className="mt-5" />
          </GuestLocked>
        </main>
      </div>
    </PageWithSidebar>
  )
}
