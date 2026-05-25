import { useEffect, useState } from 'react'
import type { ReactElement } from 'react'
import type { BadgeWithStatus } from '../services/gamification.service'

// ── Icônes SVG par slug ────────────────────────────────────────────────────────

function IconFlag({ cls }: { cls: string }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
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
      strokeWidth="2"
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
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cls}
      aria-hidden="true"
    >
      <circle cx="5.5" cy="17.5" r="3.5" />
      <circle cx="18.5" cy="17.5" r="3.5" />
      <path d="M15 6a1 1 0 0 0-1-1h-4" />
      <path d="M15 6l2.5 6.5" />
      <path d="M5.5 17.5 10 9l5 8.5" />
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
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cls}
      aria-hidden="true"
    >
      <path d="M17 8C8 10 5.9 16.17 3.82 22c2 0 7.68-1 13-6 2-2 3-5 3-8s-1-5-1-5l-1.82 5z" />
    </svg>
  )
}

function IconTree({ cls }: { cls: string }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cls}
      aria-hidden="true"
    >
      <path d="M12 22v-7" />
      <path d="M9 22h6" />
      <path d="M12 15l-5-5h3l-4-4h4l-4-5h12l-4 5h4l-4 4h3l-5 5z" />
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
      strokeWidth="2"
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

function IconLock({ cls }: { cls: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cls}
      aria-hidden="true"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}

// ── Config badge → couleur + icône ────────────────────────────────────────────

interface BadgeMeta {
  Icon: (p: { cls: string }) => ReactElement
  color: string // Tailwind text color (unlocked)
  bg: string // Tailwind bg color (unlocked)
  border: string // Tailwind border color (unlocked)
  label: string
}

const BADGE_META: Record<string, BadgeMeta> = {
  'premier-trajet': {
    Icon: IconFlag,
    color: 'text-eco-700',
    bg: 'bg-eco-100',
    border: 'border-eco-300',
    label: 'Premier trajet',
  },
  explorateur: {
    Icon: IconCompass,
    color: 'text-transit-700',
    bg: 'bg-transit-50',
    border: 'border-transit-300',
    label: 'Explorateur',
  },
  habitue: {
    Icon: IconStar,
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-300',
    label: 'Habitué',
  },
  cycliste: {
    Icon: IconBike,
    color: 'text-eco-700',
    bg: 'bg-eco-50',
    border: 'border-eco-300',
    label: 'Cycliste',
  },
  'eco-citoyen': {
    Icon: IconLeaf,
    color: 'text-eco-700',
    bg: 'bg-eco-50',
    border: 'border-eco-300',
    label: 'Éco-citoyen',
  },
  'militant-vert': {
    Icon: IconTree,
    color: 'text-eco-800',
    bg: 'bg-eco-100',
    border: 'border-eco-400',
    label: 'Militant vert',
  },
  'champion-co2': {
    Icon: IconTrophy,
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-400',
    label: 'Champion CO₂',
  },
}

const DEFAULT_META: BadgeMeta = {
  Icon: IconStar,
  color: 'text-slate-600',
  bg: 'bg-slate-100',
  border: 'border-slate-300',
  label: 'Badge',
}

// ── BadgeCard ──────────────────────────────────────────────────────────────────

interface BadgeCardProps {
  badge: BadgeWithStatus
  isNew: boolean
}

function BadgeCard({ badge, isNew }: BadgeCardProps) {
  // Animation d'entrée 300ms : scale 85→100 + opacity 0→100
  const [revealed, setRevealed] = useState(!isNew)

  useEffect(() => {
    if (!isNew) return
    const t = setTimeout(() => setRevealed(true), 60)
    return () => clearTimeout(t)
  }, [isNew])

  const meta = BADGE_META[badge.name] ?? DEFAULT_META

  const containerClass = [
    'flex flex-col items-center text-center gap-2 p-3 rounded-xl border-2 transition-all duration-300',
    badge.unlocked
      ? [
          meta.bg,
          meta.border,
          isNew && !revealed ? 'scale-90 opacity-0' : 'scale-100 opacity-100',
          isNew && revealed ? 'shadow-md' : '',
        ].join(' ')
      : 'bg-slate-50 border-slate-100 opacity-50',
  ].join(' ')

  const unlockedDate = badge.unlockedAt
    ? new Date(badge.unlockedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
    : null

  return (
    <article
      className={containerClass}
      aria-label={`Badge ${meta.label}${badge.unlocked ? ', débloqué' : ', verrouillé'}`}
    >
      {/* Icône */}
      <div className="relative">
        <div
          className={[
            'w-12 h-12 rounded-full flex items-center justify-center',
            badge.unlocked ? meta.bg : 'bg-slate-100',
          ].join(' ')}
          aria-hidden="true"
        >
          <meta.Icon cls={badge.unlocked ? meta.color : 'text-slate-400'} />
        </div>
        {!badge.unlocked && (
          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white rounded-full border border-slate-200 flex items-center justify-center">
            <IconLock cls="text-slate-400" />
          </div>
        )}
        {isNew && revealed && (
          <div
            aria-hidden="true"
            className="absolute inset-0 rounded-full animate-ping bg-eco-300 opacity-30"
          />
        )}
      </div>

      {/* Texte */}
      <div>
        <p
          className={`text-caption font-semibold leading-tight ${badge.unlocked ? meta.color : 'text-slate-400'}`}
        >
          {meta.label}
        </p>
        <p className="text-[10px] text-slate-400 leading-snug mt-0.5">{badge.description}</p>
        {unlockedDate && <p className="text-[10px] text-slate-300 mt-0.5">{unlockedDate}</p>}
      </div>
    </article>
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
    <div className="flex flex-col items-center gap-2 p-3" aria-hidden="true">
      <div className="skeleton w-12 h-12 rounded-full" />
      <div className="skeleton h-3 w-16 rounded" />
      <div className="skeleton h-2 w-20 rounded" />
    </div>
  )
}

export function BadgeGrid({ badges, newlyUnlocked = [], loading = false }: BadgeGridProps) {
  const newSet = new Set(newlyUnlocked)
  const unlocked = badges.filter((b) => b.unlocked)
  const locked = badges.filter((b) => !b.unlocked)

  return (
    <section aria-labelledby="badges-heading" className="card p-4 lg:p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 id="badges-heading" className="text-h3 font-semibold text-slate-900">
            Mes badges
          </h2>
          <p className="text-body-sm text-slate-500 mt-0.5">
            {loading
              ? '…'
              : `${unlocked.length} / ${badges.length} débloqué${unlocked.length > 1 ? 's' : ''}`}
          </p>
        </div>
        {newlyUnlocked.length > 0 && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-eco-100 text-eco-700 text-caption font-semibold animate-pulse">
            +{newlyUnlocked.length} nouveau{newlyUnlocked.length > 1 ? 'x' : ''}
          </span>
        )}
      </div>

      {loading ? (
        <div
          className="grid grid-cols-3 sm:grid-cols-4 gap-3"
          aria-busy="true"
          aria-label="Chargement des badges"
        >
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <BadgeSkeleton key={i} />
          ))}
        </div>
      ) : badges.length === 0 ? (
        <p className="text-body-sm text-slate-400 text-center py-6">Aucun badge disponible</p>
      ) : (
        <ul className="grid grid-cols-3 sm:grid-cols-4 gap-3" aria-label="Liste des badges">
          {/* Badges débloqués en premier, puis verrouillés */}
          {[...unlocked, ...locked].map((badge) => (
            <li key={badge.id}>
              <BadgeCard badge={badge} isNew={newSet.has(badge.name)} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
