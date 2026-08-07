import { useCallback, useState } from 'react'
import { getMyRedemptions, getRewardCatalog, purchaseReward } from '../services/rewards.service'
import type {
  RewardCatalog,
  RewardCatalogItem,
  RewardType,
  UserRedemption,
} from '../services/rewards.service'
import { PageWithSidebar } from '../components/PageWithSidebar'
import { useFetchResource } from '../hooks/useFetchResource'
import { useResourceCacheStore } from '../stores/resource-cache.store'
import { CACHE_KEYS, CACHE_TTL_MS } from '../constants/cache-keys'

// ── Formatage ──────────────────────────────────────────────────────────────────

function formatPoints(points: number): string {
  return `${points.toLocaleString('fr-FR')} pts`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

function RewardTypeIcon({ type, cls }: { type: RewardType; cls: string }) {
  if (type === 'museum_ticket') {
    return (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={cls}
        aria-hidden="true"
      >
        <rect x="4" y="7" width="16" height="13" rx="2.5" />
        <path d="M8 7V5a4 4 0 0 1 8 0v2M9 13h6" />
      </svg>
    )
  }
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cls}
      aria-hidden="true"
    >
      <rect x="3" y="6" width="18" height="12" rx="2.5" />
      <path d="M3 10h18M7 14h4" />
    </svg>
  )
}

// ── Squelettes ─────────────────────────────────────────────────────────────────

function RewardCardSkeleton() {
  return (
    <div className="card p-3.5 flex flex-col gap-3" aria-hidden="true">
      <div className="flex gap-3">
        <div className="skeleton size-11 rounded-md shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-4 w-2/3 rounded" />
          <div className="skeleton h-3 w-full rounded" />
        </div>
      </div>
      <div className="skeleton h-11 w-full rounded-md" />
    </div>
  )
}

function RedemptionSkeleton() {
  return <div className="skeleton h-20 w-full rounded-xl" aria-hidden="true" />
}

// ── RewardCard ─────────────────────────────────────────────────────────────────

interface RewardCardProps {
  reward: RewardCatalogItem
  totalPoints: number
  purchasing: boolean
  onPurchase: (rewardId: string) => void
}

function RewardCard({ reward, totalPoints, purchasing, onPurchase }: RewardCardProps) {
  const remaining = totalPoints - reward.pointsCost
  const progressPct = Math.min(100, Math.round((totalPoints / reward.pointsCost) * 100))

  return (
    // `h-full` : occupe toute la hauteur de la ligne de grille (même hauteur
    // que sa voisine). `justify-between` distribue l'espace restant entre le
    // bloc description et le bloc points/bouton (poussé vers le bas plutôt
    // que de laisser un vide après le bouton) ; `gap-2.5` reste un plancher
    // minimum — CSS additionne gap + espace distribué par justify-between,
    // jamais moins que gap-2.5 même si les deux cartes ont la même hauteur.
    <article
      className={`card p-3.5 h-full flex flex-col justify-between gap-2.5 ${!reward.affordable ? 'bg-surface-muted' : ''}`}
    >
      <div className="flex items-start gap-3">
        <span
          className={[
            'size-11 rounded-md flex items-center justify-center shrink-0',
            reward.affordable ? 'bg-primary-surface' : 'bg-surface-sunken',
          ].join(' ')}
        >
          <RewardTypeIcon
            type={reward.rewardType}
            cls={reward.affordable ? 'text-primary' : 'text-text-disabled'}
          />
        </span>
        <div className="flex-1 min-w-0">
          <h3
            className={`text-body-sm font-bold leading-tight ${!reward.affordable ? 'text-text-muted' : ''}`}
          >
            {reward.name}
          </h3>
          <p className="text-caption text-text-muted mt-0.5">{reward.description}</p>
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        {reward.affordable ? (
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center px-2.5 py-1.5 rounded-sm bg-primary-surface text-primary text-caption font-bold tabular-nums">
              {formatPoints(reward.pointsCost)}
            </span>
            <span className="text-caption text-text-muted">
              Il vous reste {formatPoints(remaining)} après échange
            </span>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center px-2.5 py-1.5 rounded-sm bg-surface-sunken text-text-muted text-caption font-bold tabular-nums">
                {formatPoints(reward.pointsCost)}
              </span>
              <span className="inline-flex items-center gap-1.5 text-caption font-semibold text-warning">
                <svg
                  aria-hidden="true"
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="4" y="10" width="16" height="10" rx="2.5" />
                  <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                </svg>
                Encore {formatPoints(reward.pointsCost - totalPoints)}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span
                role="progressbar"
                aria-valuenow={progressPct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Progression vers ${reward.name}`}
                className="block h-1.5 rounded-full bg-surface-sunken"
              >
                <span
                  className="block h-1.5 rounded-full bg-text-disabled"
                  style={{ width: `${progressPct}%` }}
                />
              </span>
              <span className="text-caption text-text-muted tabular-nums">
                {formatPoints(totalPoints)} / {formatPoints(reward.pointsCost)}
              </span>
            </div>
          </>
        )}

        <button
          type="button"
          disabled={!reward.affordable || purchasing}
          aria-disabled={!reward.affordable || purchasing}
          onClick={() => onPurchase(reward.id)}
          className={reward.affordable ? 'btn-primary w-full' : 'btn-secondary w-full'}
        >
          {purchasing ? 'Échange…' : 'Échanger'}
        </button>
      </div>
    </article>
  )
}

// ── RedemptionRow ──────────────────────────────────────────────────────────────

function RedemptionRow({ redemption }: { redemption: UserRedemption }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(redemption.code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard indisponible — pas bloquant */
    }
  }

  return (
    <li className="card p-3.5 flex flex-col gap-2.5">
      <div className="flex items-center gap-3">
        <span className="size-11 rounded-md bg-primary-surface flex items-center justify-center shrink-0">
          <RewardTypeIcon type={redemption.rewardType} cls="text-primary" />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-body-sm font-bold truncate">{redemption.rewardName}</p>
          <p className="text-caption text-text-muted">
            {formatPoints(redemption.pointsSpent)} · échangé le {formatDate(redemption.redeemedAt)}
          </p>
        </div>
      </div>
      <div className="flex items-center justify-between gap-2.5 p-2.5 rounded-md bg-surface-sunken">
        <code className="text-body-sm font-bold font-mono tracking-wider">{redemption.code}</code>
        <button
          type="button"
          onClick={() => void handleCopy()}
          className="h-9 px-3 rounded-sm bg-text text-bg text-caption font-semibold"
        >
          {copied ? 'Copié' : 'Copier'}
        </button>
        <span role="status" aria-live="polite" className="sr-only">
          {copied ? 'Code copié' : ''}
        </span>
      </div>
    </li>
  )
}

// ── Sections (partagées mobile/desktop) ─────────────────────────────────────────

function CatalogSection({
  loading,
  catalog,
  purchasingId,
  onPurchase,
}: {
  loading: boolean
  catalog: RewardCatalog | null
  purchasingId: string | null
  onPurchase: (rewardId: string) => void
}) {
  return (
    <div>
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
                totalPoints={catalog.totalPoints}
                purchasing={purchasingId === reward.id}
                onPurchase={onPurchase}
              />
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-body-sm text-text-muted text-center py-6">
          Aucune récompense disponible pour le moment
        </p>
      )}

      <div className="mt-3 flex items-start gap-2.5 p-3 rounded-md bg-surface-sunken">
        <svg
          aria-hidden="true"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-text-muted shrink-0 mt-0.5"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8h.01M11 12h1v4h1" />
        </svg>
        <span className="text-caption text-text-muted leading-relaxed">
          Les points sont attribués à la fin de chaque trajet terminé : 1 pt par 100 g de CO₂
          évités, plafonné à 150 pts par trajet.
        </span>
      </div>
    </div>
  )
}

function HistorySection({
  loading,
  redemptions,
}: {
  loading: boolean
  redemptions: UserRedemption[]
}) {
  return (
    <div>
      {loading ? (
        <div className="flex flex-col gap-2.5" aria-hidden="true">
          <RedemptionSkeleton />
          <RedemptionSkeleton />
        </div>
      ) : redemptions.length === 0 ? (
        <p className="text-body-sm text-text-muted text-center py-6">
          Aucune récompense échangée pour le moment
        </p>
      ) : (
        <ul className="flex flex-col gap-2.5" aria-label="Historique des récompenses">
          {redemptions.map((redemption) => (
            <RedemptionRow key={redemption.id} redemption={redemption} />
          ))}
        </ul>
      )}
      <p className="text-caption text-text-subtle mt-3">
        Historique conservé 12 mois, comme les données de trajet.
      </p>
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────────

type Tab = 'catalog' | 'history'

export default function RewardsPage() {
  const [tab, setTab] = useState<Tab>('catalog')

  const {
    data: catalogData,
    loading: catalogLoading,
    error: catalogError,
    refetch: refetchCatalog,
  } = useFetchResource(CACHE_KEYS.rewardsCatalog, getRewardCatalog, CACHE_TTL_MS.rewardsCatalog)
  const {
    data: redemptionsData,
    loading: redemptionsLoading,
    error: redemptionsError,
    refetch: refetchRedemptions,
  } = useFetchResource(
    CACHE_KEYS.rewardsRedemptions,
    getMyRedemptions,
    CACHE_TTL_MS.rewardsRedemptions
  )

  const catalog = catalogData ?? null
  const redemptions = redemptionsData ?? []
  const loading = catalogLoading || redemptionsLoading
  const error = catalogError ?? redemptionsError

  const [purchasingId, setPurchasingId] = useState<string | null>(null)
  const [purchaseError, setPurchaseError] = useState<string | null>(null)
  const [lastPurchase, setLastPurchase] = useState<{
    rewardName: string
    pointsSpent: number
    totalPoints: number
  } | null>(null)

  const handlePurchase = useCallback(
    async (rewardId: string) => {
      const reward = catalog?.rewards.find((r) => r.id === rewardId)
      if (!reward) return

      setPurchasingId(rewardId)
      setPurchaseError(null)
      try {
        const result = await purchaseReward(rewardId)
        setLastPurchase({
          rewardName: reward.name,
          pointsSpent: result.pointsSpent,
          totalPoints: result.totalPoints,
        })
        // force : le solde de points et l'historique viennent de changer
        await Promise.all([refetchCatalog(true), refetchRedemptions(true)])
        // Le solde affiché sur Dashboard (gamification-dashboard-stats) vient
        // aussi de changer — invalidé pour ne pas montrer un total périmé.
        useResourceCacheStore.getState().invalidate(CACHE_KEYS.gamificationDashboardStats)
      } catch (err) {
        setPurchaseError(
          err instanceof Error ? err.message : "Impossible d'échanger cette récompense"
        )
      } finally {
        setPurchasingId(null)
      }
    },
    [catalog, refetchCatalog, refetchRedemptions]
  )

  return (
    <PageWithSidebar>
      <div className="min-h-screen bg-bg pb-[calc(var(--height-bottomnav)+1rem)] lg:pb-6">
        <header className="bg-surface border-b border-border sticky top-0 z-navbar">
          <div className="max-w-2xl mx-auto flex flex-col gap-3 px-4 py-3.5 lg:max-w-260 lg:px-10 lg:flex-row lg:items-center lg:justify-between lg:gap-4">
            <div className="flex items-center justify-between lg:justify-start lg:gap-4">
              <h1 className="text-h3 font-bold">Récompenses</h1>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary-surface border border-primary text-primary text-body-sm font-bold tabular-nums">
                <svg
                  aria-hidden="true"
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.9"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 8v8M9 12h6" />
                </svg>
                {loading ? '…' : formatPoints(catalog?.totalPoints ?? 0)}
              </span>
            </div>
            <div
              role="tablist"
              aria-label="Catalogue ou historique"
              className="flex gap-1.5 p-1 bg-surface-sunken rounded-full lg:hidden"
              onKeyDown={(e) => {
                if (!['ArrowLeft', 'ArrowRight'].includes(e.key)) return
                e.preventDefault()
                setTab((t) => (t === 'catalog' ? 'history' : 'catalog'))
              }}
            >
              <button
                type="button"
                id="tab-catalog"
                role="tab"
                aria-selected={tab === 'catalog'}
                aria-controls="panel-catalog"
                tabIndex={tab === 'catalog' ? 0 : -1}
                onClick={() => setTab('catalog')}
                className={`flex-1 h-10 justify-center rounded-full text-body-sm font-semibold transition-colors duration-fast ${tab === 'catalog' ? 'bg-primary text-on-primary' : 'text-text'}`}
              >
                Catalogue
              </button>
              <button
                type="button"
                id="tab-history"
                role="tab"
                aria-selected={tab === 'history'}
                aria-controls="panel-history"
                tabIndex={tab === 'history' ? 0 : -1}
                onClick={() => setTab('history')}
                className={`flex-1 h-10 justify-center rounded-full text-body-sm font-semibold transition-colors duration-fast ${tab === 'history' ? 'bg-primary text-on-primary' : 'text-text'}`}
              >
                Historique
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-4 py-4 flex flex-col gap-3 lg:max-w-260 lg:px-10 lg:py-8">
          {error && (
            <div
              role="alert"
              className="bg-danger-surface rounded-xl px-4 py-3 text-danger-text text-body-sm"
            >
              {error}
            </div>
          )}
          {purchaseError && (
            <div
              role="alert"
              className="bg-danger-surface rounded-xl px-4 py-3 text-danger-text text-body-sm"
            >
              {purchaseError}
            </div>
          )}

          {/* Mobile : un seul panneau à la fois, piloté par les tabs ── */}
          <div className="lg:hidden">
            {tab === 'catalog' ? (
              <section id="panel-catalog" role="tabpanel" aria-labelledby="tab-catalog">
                <CatalogSection
                  loading={loading}
                  catalog={catalog}
                  purchasingId={purchasingId}
                  onPurchase={handlePurchase}
                />
              </section>
            ) : (
              <section id="panel-history" role="tabpanel" aria-labelledby="tab-history">
                <HistorySection loading={loading} redemptions={redemptions} />
              </section>
            )}
          </div>

          {/* Desktop : Catalogue + Historique côte à côte, pas de tabs
           * (MAQUETTE.md §5.5 — "cohabitation sans tabs") ── */}
          <div className="hidden lg:grid lg:grid-cols-[1.6fr_1fr] lg:gap-5 lg:items-start">
            <section aria-labelledby="catalog-heading-lg">
              <h2 id="catalog-heading-lg" className="text-h3 font-bold mb-3">
                Catalogue
              </h2>
              <CatalogSection
                loading={loading}
                catalog={catalog}
                purchasingId={purchasingId}
                onPurchase={handlePurchase}
              />
            </section>
            <section aria-labelledby="history-heading-lg">
              <h2 id="history-heading-lg" className="text-h3 font-bold mb-3">
                Historique
              </h2>
              <HistorySection loading={loading} redemptions={redemptions} />
            </section>
          </div>
        </main>
      </div>

      {lastPurchase && (
        <div role="status" className="toast justify-between">
          <span className="size-9 rounded-full bg-primary flex items-center justify-center shrink-0">
            <svg
              aria-hidden="true"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-on-primary"
            >
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </span>
          <span className="flex-1 flex flex-col gap-0.5">
            <span className="text-body-sm font-bold">{lastPurchase.rewardName} échangé</span>
            <span className="text-caption text-text-muted">
              −{formatPoints(lastPurchase.pointsSpent)} · solde{' '}
              {formatPoints(lastPurchase.totalPoints)}
            </span>
          </span>
          <button
            type="button"
            aria-label="Fermer la notification"
            onClick={() => setLastPurchase(null)}
            className="size-8 rounded-full flex items-center justify-center shrink-0 bg-surface-sunken"
          >
            <svg
              aria-hidden="true"
              width="11"
              height="11"
              viewBox="0 0 14 14"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M1 1l12 12M13 1L1 13" />
            </svg>
          </button>
        </div>
      )}
    </PageWithSidebar>
  )
}
