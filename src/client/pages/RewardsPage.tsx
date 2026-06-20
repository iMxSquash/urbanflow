import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getMyRedemptions, getRewardCatalog, purchaseReward } from '../services/rewards.service'
import type {
  RewardCatalog,
  RewardCatalogItem,
  RewardType,
  UserRedemption,
} from '../services/rewards.service'
import { BottomNav } from '../components/BottomNav'

// ── Config ───────────────────────────────────────────────────────────────────

const REWARD_TYPE_META: Record<RewardType, { label: string; textClass: string; icon: string }> = {
  discount_code: { label: 'Code de réduction', textClass: 'text-accent-transit', icon: '🏷️' },
  museum_ticket: { label: 'Billet musée', textClass: 'text-accent-eco', icon: '🎟️' },
}

// ── Formatage ─────────────────────────────────────────────────────────────────

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

// ── Squelettes ────────────────────────────────────────────────────────────────

function RewardCardSkeleton() {
  return (
    <div className="bg-bg-card rounded-card p-4 space-y-3" aria-hidden="true">
      <div className="skeleton h-5 w-28 rounded-full" />
      <div className="skeleton h-5 w-3/4 rounded" />
      <div className="skeleton h-3 w-full rounded" />
      <div className="skeleton h-3 w-2/3 rounded" />
      <div className="skeleton h-9 w-full rounded-xl mt-1" />
    </div>
  )
}

function RedemptionSkeleton() {
  return <div className="skeleton h-[4.5rem] w-full rounded-card" aria-hidden="true" />
}

// ── RewardCard ────────────────────────────────────────────────────────────────

interface RewardCardProps {
  reward: RewardCatalogItem
  purchasing: boolean
  onPurchase: (rewardId: string) => void
}

function RewardCard({ reward, purchasing, onPurchase }: RewardCardProps) {
  const meta = REWARD_TYPE_META[reward.rewardType]

  return (
    <article className="bg-bg-card rounded-card p-4 flex flex-col gap-3 border border-border">
      {/* Type badge */}
      <span
        className={`self-start inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-bg-elevated text-caption font-semibold ${meta.textClass}`}
      >
        <span aria-hidden="true">{meta.icon}</span>
        {meta.label}
      </span>

      {/* Info */}
      <div className="flex-1">
        <h3 className="text-body font-semibold text-text-primary">{reward.name}</h3>
        <p className="text-body-sm text-text-muted mt-1">{reward.description}</p>
        <p className="text-caption text-text-disabled mt-1">{reward.partnerName}</p>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <span className="text-body font-bold text-accent-eco tabular-nums">
          {formatPoints(reward.pointsCost)}
        </span>
        <button
          type="button"
          disabled={!reward.affordable || purchasing}
          aria-disabled={!reward.affordable || purchasing}
          onClick={() => onPurchase(reward.id)}
          className={[
            'btn-primary px-4 py-2 text-body-sm',
            (!reward.affordable || purchasing) && 'opacity-50 cursor-not-allowed',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          {purchasing ? 'Échange…' : reward.affordable ? 'Échanger' : 'Solde insuffisant'}
        </button>
      </div>
    </article>
  )
}

// ── RedemptionRow ─────────────────────────────────────────────────────────────

function RedemptionRow({ redemption }: { redemption: UserRedemption }) {
  const meta = REWARD_TYPE_META[redemption.rewardType]

  return (
    <li className="bg-bg-card rounded-card p-4 flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="text-body-sm font-semibold text-text-primary truncate">
          {redemption.rewardName}
        </p>
        <p className="text-caption text-text-muted mt-0.5">
          {formatDate(redemption.redeemedAt)} · {formatPoints(redemption.pointsSpent)}
        </p>
      </div>
      <code
        className={`shrink-0 px-2.5 py-1 rounded-full bg-bg-elevated text-caption font-mono font-semibold ${meta.textClass}`}
      >
        {redemption.code}
      </code>
    </li>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

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

  const totalPoints = catalog?.totalPoints ?? 0

  return (
    <div className="flex flex-col h-screen bg-bg-base">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <header className="shrink-0 px-4 pt-14 pb-4 flex items-center justify-between gap-4">
        <Link
          to="/dashboard"
          aria-label="Retour au tableau de bord"
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
          <h1 className="text-h2 font-bold text-text-primary">Récompenses</h1>
          <p className="text-caption text-text-muted">
            {loading ? 'Chargement…' : `Solde : ${formatPoints(totalPoints)}`}
          </p>
        </div>
      </header>

      {/* ── Contenu scrollable ─────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 pb-8 space-y-6">
          {/* ── Erreur de chargement ─────────────────────────────────────── */}
          {error && (
            <div
              role="alert"
              className="bg-bg-elevated border border-accent-error rounded-card px-4 py-3 text-accent-error text-body-sm"
            >
              {error}
            </div>
          )}

          {/* ── Solde de points ──────────────────────────────────────────── */}
          {!loading && catalog && (
            <div className="bg-bg-card rounded-card p-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-caption text-text-muted mb-1">Solde disponible</p>
                <p className="text-display font-extrabold text-text-primary leading-none">
                  {totalPoints.toLocaleString('fr-FR')}
                </p>
                <p className="text-caption text-text-muted mt-1">points</p>
              </div>
              <div
                className="w-14 h-14 rounded-full bg-accent-eco flex items-center justify-center shrink-0 text-2xl"
                aria-hidden="true"
              >
                🌿
              </div>
            </div>
          )}

          {/* ── Confirmation d'achat ─────────────────────────────────────── */}
          {lastPurchase && (
            <div
              role="status"
              aria-live="polite"
              className="bg-bg-elevated border border-accent-eco rounded-card px-4 py-3 text-accent-eco text-body-sm space-y-1"
            >
              <p className="font-semibold flex items-center gap-2">
                <svg
                  aria-hidden="true"
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                >
                  <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z" />
                </svg>
                «&thinsp;{lastPurchase.rewardName}&thinsp;» échangé avec succès !
              </p>
              <p className="text-text-secondary">
                Votre code :{' '}
                <code className="font-mono font-bold text-accent-eco">{lastPurchase.code}</code>
                {' '}— retrouvez-le dans «&thinsp;Mes récompenses&thinsp;» ci-dessous.
              </p>
            </div>
          )}

          {/* ── Erreur d'achat ───────────────────────────────────────────── */}
          {purchaseError && (
            <div
              role="alert"
              className="bg-bg-elevated border border-accent-error rounded-card px-4 py-3 text-accent-error text-body-sm"
            >
              {purchaseError}
            </div>
          )}

          {/* ── Section 1 : Catalogue ────────────────────────────────────── */}
          <section aria-labelledby="catalog-heading">
            <h2
              id="catalog-heading"
              className="text-h3 font-semibold text-accent-eco mb-3 px-1"
            >
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
              <p className="text-body-sm text-text-muted text-center py-8">
                Aucune récompense disponible pour le moment
              </p>
            )}
          </section>

          {/* ── Section 2 : Historique ───────────────────────────────────── */}
          <section aria-labelledby="history-heading">
            <h2
              id="history-heading"
              className="text-h3 font-semibold text-accent-eco mb-3 px-1"
            >
              Mes récompenses
            </h2>

            <div className="bg-bg-card rounded-card px-4 py-3">
              <p className="text-body-sm text-text-muted mb-4">
                {loading
                  ? '…'
                  : `${redemptions.length} récompense${redemptions.length > 1 ? 's' : ''} échangée${redemptions.length > 1 ? 's' : ''}`}
              </p>

              {loading ? (
                <div className="space-y-2" aria-busy="true" aria-label="Chargement de l'historique">
                  <RedemptionSkeleton />
                  <RedemptionSkeleton />
                </div>
              ) : redemptions.length === 0 ? (
                <p className="text-body-sm text-text-muted text-center py-6">
                  Aucune récompense échangée pour le moment
                </p>
              ) : (
                <ul className="space-y-2" aria-label="Historique des récompenses">
                  {redemptions.map((redemption) => (
                    <RedemptionRow key={redemption.id} redemption={redemption} />
                  ))}
                </ul>
              )}
            </div>
          </section>
        </div>
      </main>

      {/* ── Bottom Navigation ─────────────────────────────────────────────── */}
      <BottomNav />
    </div>
  )
}
