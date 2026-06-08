import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getMyRedemptions, getRewardCatalog, purchaseReward } from '../services/rewards.service'
import type {
  RewardCatalog,
  RewardCatalogItem,
  RewardType,
  UserRedemption,
} from '../services/rewards.service'

// ── Formatage ──────────────────────────────────────────────────────────────────

function formatPoints(points: number): string {
  return `${points.toLocaleString('fr-FR')} pts`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

const REWARD_TYPE_META: Record<RewardType, { label: string; color: string; bg: string }> = {
  discount_code: { label: 'Code de réduction', color: 'text-transit-700', bg: 'bg-transit-50' },
  museum_ticket: { label: 'Billet musée', color: 'text-eco-700', bg: 'bg-eco-100' },
}

// ── Squelettes ─────────────────────────────────────────────────────────────────

function RewardCardSkeleton() {
  return (
    <div className="card p-4 space-y-3" aria-hidden="true">
      <div className="skeleton h-5 w-28 rounded-full" />
      <div className="skeleton h-5 w-3/4 rounded" />
      <div className="skeleton h-3 w-full rounded" />
      <div className="skeleton h-3 w-2/3 rounded" />
      <div className="skeleton h-9 w-full rounded-button" />
    </div>
  )
}

function RedemptionSkeleton() {
  return <div className="skeleton h-16 w-full rounded-card" aria-hidden="true" />
}

// ── RewardCard ─────────────────────────────────────────────────────────────────

interface RewardCardProps {
  reward: RewardCatalogItem
  purchasing: boolean
  onPurchase: (rewardId: string) => void
}

function RewardCard({ reward, purchasing, onPurchase }: RewardCardProps) {
  const meta = REWARD_TYPE_META[reward.rewardType]

  return (
    <article className="card p-4 flex flex-col gap-3">
      <span
        className={`self-start inline-flex items-center px-2.5 py-1 rounded-full text-caption font-semibold ${meta.bg} ${meta.color}`}
      >
        {meta.label}
      </span>
      <div>
        <h3 className="text-body font-semibold text-slate-900">{reward.name}</h3>
        <p className="text-body-sm text-slate-500 mt-1">{reward.description}</p>
        <p className="text-caption text-slate-400 mt-1">{reward.partnerName}</p>
      </div>
      <div className="mt-auto flex items-center justify-between gap-3 pt-1">
        <span className="text-body font-bold text-slate-900">
          {formatPoints(reward.pointsCost)}
        </span>
        <button
          type="button"
          disabled={!reward.affordable || purchasing}
          aria-disabled={!reward.affordable || purchasing}
          onClick={() => onPurchase(reward.id)}
          className="btn-primary px-4"
        >
          {purchasing ? 'Échange…' : reward.affordable ? 'Échanger' : 'Solde insuffisant'}
        </button>
      </div>
    </article>
  )
}

// ── RedemptionRow ──────────────────────────────────────────────────────────────

function RedemptionRow({ redemption }: { redemption: UserRedemption }) {
  const meta = REWARD_TYPE_META[redemption.rewardType]

  return (
    <li className="card p-4 flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="text-body-sm font-semibold text-slate-900 truncate">
          {redemption.rewardName}
        </p>
        <p className="text-caption text-slate-400 mt-0.5">
          {formatDate(redemption.redeemedAt)} · {formatPoints(redemption.pointsSpent)}
        </p>
      </div>
      <code
        className={`shrink-0 px-2.5 py-1 rounded-full text-caption font-mono font-semibold ${meta.bg} ${meta.color}`}
      >
        {redemption.code}
      </code>
    </li>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function RewardsPage() {
  const [catalog, setCatalog] = useState<RewardCatalog | null>(null)
  const [redemptions, setRedemptions] = useState<UserRedemption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [purchasingId, setPurchasingId] = useState<string | null>(null)
  const [purchaseError, setPurchaseError] = useState<string | null>(null)
  const [lastPurchase, setLastPurchase] = useState<{ rewardName: string; code: string } | null>(
    null
  )

  const load = useCallback(() => {
    return Promise.all([getRewardCatalog(), getMyRedemptions()]).then(([c, r]) => {
      setCatalog(c)
      setRedemptions(r)
    })
  }, [])

  useEffect(() => {
    load()
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Erreur de chargement')
      })
      .finally(() => setLoading(false))
  }, [load])

  const handlePurchase = useCallback(
    async (rewardId: string) => {
      const reward = catalog?.rewards.find((r) => r.id === rewardId)
      if (!reward) return

      setPurchasingId(rewardId)
      setPurchaseError(null)
      setLastPurchase(null)
      try {
        const result = await purchaseReward(rewardId)
        setLastPurchase({ rewardName: reward.name, code: result.code })
        await load()
      } catch (err) {
        setPurchaseError(
          err instanceof Error ? err.message : "Impossible d'échanger cette récompense"
        )
      } finally {
        setPurchasingId(null)
      }
    },
    [catalog, load]
  )

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-navbar">
        <div className="max-w-2xl mx-auto flex items-center gap-3 px-4 h-16">
          <Link
            to="/dashboard"
            aria-label="Retour au tableau de bord"
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
            <h1 className="text-h2 font-bold text-slate-900 leading-tight">
              Boutique de récompenses
            </h1>
            <p className="text-caption text-slate-400">
              {loading
                ? 'Chargement du solde…'
                : `Solde : ${formatPoints(catalog?.totalPoints ?? 0)}`}
            </p>
          </div>
        </div>
      </header>

      {/* ── Contenu ─────────────────────────────────────────────────────────── */}
      <main className="max-w-2xl mx-auto px-4 py-6 lg:px-6 space-y-6">
        {/* Erreur de chargement */}
        {error && (
          <div
            role="alert"
            className="bg-red-50 border border-red-200 rounded-card px-4 py-3 text-red-700 text-body-sm"
          >
            {error}
          </div>
        )}

        {/* Confirmation d'achat */}
        {lastPurchase && (
          <div
            role="status"
            className="bg-eco-50 border border-eco-200 rounded-card px-4 py-3 text-eco-800 text-body-sm space-y-1"
          >
            <p className="font-semibold">« {lastPurchase.rewardName} » échangé avec succès !</p>
            <p>
              Votre code : <code className="font-mono font-semibold">{lastPurchase.code}</code> —
              retrouvez-le dans « Mes récompenses » ci-dessous.
            </p>
          </div>
        )}

        {/* Erreur d'achat */}
        {purchaseError && (
          <div
            role="alert"
            className="bg-red-50 border border-red-200 rounded-card px-4 py-3 text-red-700 text-body-sm"
          >
            {purchaseError}
          </div>
        )}

        {/* ── Section 1 : Catalogue ─────────────────────────────────────── */}
        <section aria-labelledby="catalog-heading">
          <h2 id="catalog-heading" className="text-h3 font-semibold text-slate-900 mb-3">
            Catalogue
          </h2>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <RewardCardSkeleton />
              <RewardCardSkeleton />
              <RewardCardSkeleton />
              <RewardCardSkeleton />
            </div>
          ) : catalog && catalog.rewards.length > 0 ? (
            <ul
              className="grid grid-cols-1 sm:grid-cols-2 gap-3"
              aria-label="Catalogue des récompenses"
            >
              {catalog.rewards.map((reward) => (
                <li key={reward.id}>
                  <RewardCard
                    reward={reward}
                    purchasing={purchasingId === reward.id}
                    onPurchase={handlePurchase}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-body-sm text-slate-400 text-center py-6">
              Aucune récompense disponible pour le moment
            </p>
          )}
        </section>

        {/* ── Section 2 : Historique ────────────────────────────────────── */}
        <section aria-labelledby="history-heading" className="card p-4 lg:p-6">
          <h2 id="history-heading" className="text-h3 font-semibold text-slate-900 mb-1">
            Mes récompenses
          </h2>
          <p className="text-body-sm text-slate-500 mb-4">
            {loading
              ? '…'
              : `${redemptions.length} récompense${redemptions.length > 1 ? 's' : ''} échangée${redemptions.length > 1 ? 's' : ''}`}
          </p>
          {loading ? (
            <div className="space-y-2" aria-hidden="true">
              <RedemptionSkeleton />
              <RedemptionSkeleton />
            </div>
          ) : redemptions.length === 0 ? (
            <p className="text-body-sm text-slate-400 text-center py-6">
              Aucune récompense échangée pour le moment
            </p>
          ) : (
            <ul className="space-y-2" aria-label="Historique des récompenses">
              {redemptions.map((redemption) => (
                <RedemptionRow key={redemption.id} redemption={redemption} />
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  )
}
