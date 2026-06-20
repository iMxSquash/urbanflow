import { lazy, Suspense, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BadgeGrid } from '../components/BadgeGrid'
import { BottomNav } from '../components/BottomNav'
import { getDashboardStats, getUserBadges } from '../services/gamification.service'
import type { BadgeWithStatus, DashboardStats } from '../services/gamification.service'

const WeeklyCo2Chart = lazy(() => import('../components/WeeklyCo2Chart'))
const ModePieChart = lazy(() => import('../components/ModePieChart'))

// ── Formatage ──────────────────────────────────────────────────────────────────

function formatCo2(grams: number): string {
  if (grams === 0) return '0 g'
  return grams >= 1000 ? `${(grams / 1000).toFixed(1)} kg` : `${grams} g`
}

// ── Squelettes ─────────────────────────────────────────────────────────────────

function StatSkeleton() {
  return (
    <div className="bg-bg-card rounded-card p-4 space-y-2" aria-hidden="true">
      <div className="skeleton h-3 w-20 rounded" />
      <div className="skeleton h-8 w-24 rounded" />
      <div className="skeleton h-3 w-16 rounded" />
    </div>
  )
}

function ChartSkeleton({ height = 'h-44' }: { height?: string }) {
  return (
    <div className={`${height} flex items-center justify-center`} aria-hidden="true">
      <div className="skeleton w-full h-full rounded-xl" />
    </div>
  )
}

// ── Stat card ──────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string
  value: string
  sub: string
}

function StatCard({ label, value, sub }: StatCardProps) {
  return (
    <div className="bg-bg-card rounded-card p-4">
      <p className="text-caption text-text-muted mb-1">{label}</p>
      <p className="text-display font-extrabold text-text-primary leading-none">{value}</p>
      <p className="text-caption text-text-muted mt-1">{sub}</p>
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────────

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

  return (
    <div className="flex flex-col h-screen bg-bg-base">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header className="shrink-0 px-4 pt-14 pb-4 flex items-center justify-between gap-4">
        <Link
          to="/"
          aria-label="Retour à la carte"
          className="shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-bg-elevated text-text-secondary hover:text-text-primary hover:bg-bg-card transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-eco"
        >
          <svg
            aria-hidden="true"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </Link>
        <div className="text-right">
          <h1 className="text-h2 font-bold text-text-primary">Mes stats</h1>
          <p className="text-caption text-text-muted capitalize">{monthLabel}</p>
        </div>
      </header>

      {/* ── Contenu scrollable ──────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 pb-8 space-y-6">
          {/* Erreur globale */}
          {error && (
            <div
              role="alert"
              className="bg-bg-elevated border border-accent-error rounded-card px-4 py-3 text-accent-error text-body-sm"
            >
              {error}
            </div>
          )}

          {/* ── Section 1 : Résumé mensuel ──────────────────────────────────── */}
          <section aria-labelledby="summary-heading">
            <h2
              id="summary-heading"
              className="text-h3 font-semibold text-text-primary mb-3"
            >
              Ce mois
            </h2>

            {loading ? (
              <>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <StatSkeleton />
                  <StatSkeleton />
                </div>
                <StatSkeleton />
              </>
            ) : stats ? (
              <>
                {/* 2-up row: CO₂ + Trajets */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <StatCard
                    label="CO₂ économisé"
                    value={formatCo2(stats.summary.co2SavedGrams)}
                    sub="vs voiture"
                  />
                  <StatCard
                    label="Trajets"
                    value={String(stats.summary.tripCount)}
                    sub={stats.summary.tripCount > 1 ? 'ce mois' : 'ce mois'}
                  />
                </div>
                {/* Full-width: Points */}
                <StatCard
                  label="Points"
                  value={stats.summary.totalPoints.toLocaleString('fr-FR')}
                  sub="cumulés"
                />
              </>
            ) : null}

            {!loading && stats && (
              <Link
                to="/rewards"
                className="mt-3 inline-flex items-center gap-1.5 text-body-sm font-medium text-accent-eco hover:opacity-80 transition-opacity duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-eco rounded px-1"
              >
                Échanger mes points contre des récompenses
                <svg
                  aria-hidden="true"
                  width="14"
                  height="14"
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M8 4l6 6-6 6" />
                </svg>
              </Link>
            )}
          </section>

          {/* ── Section 2 : CO₂ par semaine ─────────────────────────────────── */}
          <div>
            <h2 className="text-h3 font-semibold text-text-primary mb-3">
              CO₂ par semaine
            </h2>
            <section className="card p-4 lg:p-5" aria-labelledby="weekly-heading">
              <p
                id="weekly-heading"
                className="text-body-sm font-semibold text-text-primary mb-0.5"
              >
                CO₂ économisé / semaine
              </p>
              <p className="text-caption text-text-muted mb-4">
                4 dernières semaines · g CO₂e
              </p>
              {loading ? (
                <ChartSkeleton height="h-44" />
              ) : stats ? (
                <Suspense fallback={<ChartSkeleton height="h-44" />}>
                  <WeeklyCo2Chart data={stats.weeklyCo2} />
                </Suspense>
              ) : null}
            </section>
          </div>

          {/* ── Section 3 : Modes utilisés ──────────────────────────────────── */}
          <div>
            <h2 className="text-h3 font-semibold text-text-primary mb-3">
              Modes utilisés
            </h2>
            <section className="card p-4 lg:p-5" aria-labelledby="modes-heading">
              <p className="text-caption text-text-muted mb-4" id="modes-heading">
                Ce mois · mode principal par trajet
              </p>
              {loading ? (
                <ChartSkeleton height="h-52" />
              ) : stats ? (
                <Suspense fallback={<ChartSkeleton height="h-52" />}>
                  <ModePieChart data={stats.modeBreakdown} tripCount={stats.summary.tripCount} />
                </Suspense>
              ) : null}
            </section>
          </div>

          {/* ── Section 4 : Badges ──────────────────────────────────────────── */}
          <BadgeGrid badges={badges} loading={loading} />
        </div>
      </main>

      {/* ── Bottom Navigation ── */}
      <BottomNav />
    </div>
  )
}
