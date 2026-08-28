import type { ReactElement } from 'react'
import type { BadgeWithStatus } from '../services/gamification.service'

// ── Icônes SVG par slug (set Estuaire, viewBox 0 0 24 24) ──────────────────────

function IconFlag({ cls }: { cls: string }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cls}
      aria-hidden="true"
    >
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
      <line x1="4" y1="22" x2="4" y2="15" />
    </svg>
  )
}

function IconCompass({ cls }: { cls: string }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cls}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
    </svg>
  )
}

function IconStar({ cls }: { cls: string }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={cls}
      aria-hidden="true"
    >
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  )
}

function IconBike({ cls }: { cls: string }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cls}
      aria-hidden="true"
    >
      <circle cx="6" cy="17" r="3" />
      <circle cx="18" cy="17" r="3" />
      <path d="M9 17h5l-2-7 3-2M13 8h3" />
    </svg>
  )
}

function IconLeaf({ cls }: { cls: string }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cls}
      aria-hidden="true"
    >
      <path d="M17 8C8 10 5.9 16.17 3.82 22c2 0 7.68-1 13-6 2-2 3-5 3-8s-1-5-1-5l-1.82 5z" />
    </svg>
  )
}

function IconNavibus({ cls }: { cls: string }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cls}
      aria-hidden="true"
    >
      <path d="M3.5 16l1.5-5h14l1.5 5M6.5 11V7h11v4M3.5 20c1.4 0 2.4-1 3.8-1s2.4 1 3.8 1 2.4-1 3.8-1 2.4 1 3.8 1" />
    </svg>
  )
}

function IconTrophy({ cls }: { cls: string }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cls}
      aria-hidden="true"
    >
      <polyline points="8 21 12 17 16 21" />
      <line x1="12" y1="17" x2="12" y2="11" />
      <path d="M7 4H4a2 2 0 0 0-2 2v1c0 4 3 7 6 8" />
      <path d="M17 4h3a2 2 0 0 1 2 2v1c0 4-3 7-6 8" />
      <rect x="7" y="2" width="10" height="9" rx="1" />
    </svg>
  )
}

function IconCheck({ cls }: { cls: string }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cls}
      aria-hidden="true"
    >
      <path d="M20 6L9 17l-5-5" />
    </svg>
  )
}

// ── Config badge → couleur + icône ────────────────────────────────────────────

interface BadgeMeta {
  Icon: (p: { cls: string }) => ReactElement
  label: string
}

const BADGE_META: Record<string, BadgeMeta> = {
  'premier-trajet': { Icon: IconFlag, label: 'Premier trajet' },
  explorateur: { Icon: IconCompass, label: 'Explorateur' },
  habitue: { Icon: IconStar, label: 'Habitué' },
  cycliste: { Icon: IconBike, label: 'Cycliste' },
  'eco-citoyen': { Icon: IconLeaf, label: 'Éco-citoyen' },
  'militant-vert': { Icon: IconLeaf, label: 'Militant vert' },
  'premier-navibus': { Icon: IconNavibus, label: 'Premier navibus' },
  'champion-co2': { Icon: IconTrophy, label: 'Champion CO₂' },
}

const DEFAULT_META: BadgeMeta = { Icon: IconStar, label: 'Badge' }

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

// ── Cartes ─────────────────────────────────────────────────────────────────────

function UnlockedBadgeCard({ badge, isNew }: { badge: BadgeWithStatus; isNew: boolean }) {
  const meta = BADGE_META[badge.name] ?? DEFAULT_META
  return (
    <article
      className={[
        'flex flex-col items-center text-center gap-2 p-3.5 rounded-xl border-[1.5px] border-primary bg-surface',
        isNew ? 'animate-badge-unlock' : '',
      ].join(' ')}
      aria-label={`Badge ${meta.label}, débloqué${badge.unlockedAt ? ` le ${formatDate(badge.unlockedAt)}` : ''}`}
    >
      <span className="size-12 rounded-full bg-primary-surface flex items-center justify-center">
        <meta.Icon cls="text-primary" />
      </span>
      <span className="text-body-sm font-bold leading-tight">{meta.label}</span>
      {badge.unlockedAt && (
        <span className="inline-flex items-center gap-1 text-caption font-semibold text-primary">
          <IconCheck cls="text-primary" />
          {formatDate(badge.unlockedAt)}
        </span>
      )}
    </article>
  )
}

function LockedBadgeRow({ badge }: { badge: BadgeWithStatus }) {
  const meta = BADGE_META[badge.name] ?? DEFAULT_META
  const progress = Math.min(badge.currentValue, badge.thresholdValue)
  return (
    <li className="flex items-center gap-3 p-3 rounded-xl bg-surface border border-border">
      <span className="size-10 rounded-full bg-surface-sunken flex items-center justify-center shrink-0">
        <meta.Icon cls="text-text-disabled" />
      </span>
      <span className="flex-1 flex flex-col gap-0.5">
        <span className="text-body-sm font-semibold">{meta.label}</span>
        <span className="text-caption text-text-muted">{badge.description}</span>
      </span>
      <span className="text-caption font-bold text-text-subtle tabular-nums shrink-0">
        {progress}/{badge.thresholdValue}
      </span>
    </li>
  )
}

// ── BadgeGrid ──────────────────────────────────────────────────────────────────

interface BadgeGridProps {
  badges: BadgeWithStatus[]
  newlyUnlocked?: string[]
  loading?: boolean
}

function BadgeSkeleton() {
  return (
    <div className="flex flex-col items-center gap-2 p-3.5" aria-hidden="true">
      <div className="skeleton size-12 rounded-full" />
      <div className="skeleton h-3 w-16 rounded" />
    </div>
  )
}

export function BadgeGrid({ badges, newlyUnlocked = [], loading = false }: BadgeGridProps) {
  const newSet = new Set(newlyUnlocked)
  const unlocked = badges.filter((b) => b.unlocked)
  const locked = badges.filter((b) => !b.unlocked)

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-2.5" aria-busy="true" aria-label="Chargement des badges">
        {[0, 1, 2, 3].map((i) => (
          <BadgeSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (badges.length === 0) {
    return <p className="text-body-sm text-text-muted text-center py-6">Aucun badge disponible</p>
  }

  return (
    <div className="flex flex-col gap-4">
      {unlocked.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="text-caption font-bold tracking-[0.06em] uppercase text-text-subtle">
            Débloqués
          </span>
          <div className="grid grid-cols-2 gap-2.5">
            {unlocked.map((badge) => (
              <UnlockedBadgeCard key={badge.id} badge={badge} isNew={newSet.has(badge.name)} />
            ))}
          </div>
        </div>
      )}

      {locked.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="text-caption font-bold tracking-[0.06em] uppercase text-text-subtle">
            En cours
          </span>
          <ul className="flex flex-col gap-2">
            {locked.map((badge) => (
              <LockedBadgeRow key={badge.id} badge={badge} />
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
