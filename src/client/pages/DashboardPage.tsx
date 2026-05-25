import { lazy, Suspense, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BadgeGrid } from '../components/BadgeGrid'
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
    <div className="card p-4 space-y-2" aria-hidden="true">
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
  accent: string
}

function StatCard({ label, value, sub, accent }: StatCardProps) {
  return (
    <div className={`card p-4 border-l-4 ${accent}`}>
      <p className="text-caption text-slate-500 mb-1">{label}</p>
      <p className="text-display font-bold text-slate-900 leading-none">{value}</p>
      <p className="text-caption text-slate-400 mt-1">{sub}</p>
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
    <div className="min-h-screen bg-slate-50">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-navbar">
        <div className="max-w-2xl mx-auto flex items-center gap-3 px-4 h-16">
          <Link
            to="/"
            aria-label="Retour à la carte"
            className="shrink-0 w-12 h-12 flex items-center justify-center rounded-button text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eco-600"
          >
            <svg
              aria-hidden="true"
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 16l-6-6 6-6" />
            </svg>
          </Link>
          <div>
            <h1 className="text-h2 font-bold text-slate-900 leading-tight">Tableau de bord</h1>
            <p className="text-caption text-slate-400 capitalize">{monthLabel}</p>
          </div>
        </div>
      </header>

      {/* ── Contenu ─────────────────────────────────────────────────────────── */}
      <main className="max-w-2xl mx-auto px-4 py-6 lg:px-6 space-y-6">
        {/* Erreur globale */}
        {error && (
          <div
            role="alert"
            className="bg-red-50 border border-red-200 rounded-card px-4 py-3 text-red-700 text-body-sm"
          >
            {error}
          </div>
        )}

        {/* ── Section 1 : Résumé mensuel ────────────────────────────────── */}
        <section aria-labelledby="summary-heading">
          <h2 id="summary-heading" className="text-h3 font-semibold text-slate-900 mb-3">
            Ce mois-ci
          </h2>
          {loading ? (
            <div className="grid grid-cols-3 gap-3">
              <StatSkeleton />
              <StatSkeleton />
              <StatSkeleton />
            </div>
          ) : stats ? (
            <div className="grid grid-cols-3 gap-3">
              <StatCard
                label="CO₂ économisé"
                value={formatCo2(stats.summary.co2SavedGrams)}
                sub="vs voiture"
                accent="border-eco-500"
              />
              <StatCard
                label="Trajets"
                value={String(stats.summary.tripCount)}
                sub={stats.summary.tripCount > 1 ? 'enregistrés' : 'enregistré'}
                accent="border-transit-400"
              />
              <StatCard
                label="Points"
                value={String(stats.summary.totalPoints)}
                sub="cumulés"
                accent="border-amber-400"
              />
            </div>
          ) : null}
        </section>

        {/* ── Section 2 : CO2 hebdomadaire ─────────────────────────────── */}
        <section className="card p-4 lg:p-5" aria-labelledby="weekly-heading">
          <h2 id="weekly-heading" className="text-h3 font-semibold text-slate-900 mb-0.5">
            Économies CO₂ par semaine
          </h2>
          <p className="text-caption text-slate-400 mb-4">
            4 dernières semaines · g CO₂e économisés
          </p>
          {loading ? (
            <ChartSkeleton height="h-44" />
          ) : stats ? (
            <Suspense fallback={<ChartSkeleton height="h-44" />}>
              <WeeklyCo2Chart data={stats.weeklyCo2} />
            </Suspense>
          ) : null}
        </section>

        {/* ── Section 3 : Répartition des modes ────────────────────────── */}
        <section className="card p-4 lg:p-5" aria-labelledby="modes-heading">
          <h2 id="modes-heading" className="text-h3 font-semibold text-slate-900 mb-0.5">
            Modes utilisés
          </h2>
          <p className="text-caption text-slate-400 mb-4">Ce mois · mode principal par trajet</p>
          {loading ? (
            <ChartSkeleton height="h-52" />
          ) : stats ? (
            <Suspense fallback={<ChartSkeleton height="h-52" />}>
              <ModePieChart data={stats.modeBreakdown} />
            </Suspense>
          ) : null}
        </section>

        {/* ── Section 4 : Badges ───────────────────────────────────────── */}
        <BadgeGrid badges={badges} loading={loading} />
      </main>
    </div>
  )
}
