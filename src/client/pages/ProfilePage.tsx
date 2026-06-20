import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useProfileStore } from '../stores/profile.store'
import { useAuthStore } from '../stores/auth.store'
import { useGamificationStore } from '../stores/gamification.store'
import { getUserBadges } from '../services/gamification.service'
import type { BadgeWithStatus } from '../services/gamification.service'
import { BadgeGrid } from '../components/BadgeGrid'
import { BottomNav } from '../components/BottomNav'
import type { MobilityProfile, TransportMode, UserPreference } from '@shared/types/index'

// ── Design tokens ────────────────────────────────────────────────────────────

const MODE_COLORS: Record<TransportMode, string> = {
  walk: '#94a3b8',
  bike: '#4ade80',
  tramway: '#818cf8',
  bus: '#fcd34d',
  scooter: '#22d3ee',
  navibus: '#38bdf8',
  train: '#a78bfa',
}

// ── Config ───────────────────────────────────────────────────────────────────

// Order matches the Figma (Équilibré | Rapide | Éco)
const PREF_OPTIONS: Array<{ value: UserPreference; label: string }> = [
  { value: 'balanced', label: 'Équilibré' },
  { value: 'fast', label: 'Rapide' },
  { value: 'eco', label: 'Éco' },
]

// Order matches the Figma (Marche, Tramway, Bus, Vélo, Trottinette, Navibus, Train)
const MODE_OPTIONS: Array<{ value: TransportMode; label: string; icon: string }> = [
  { value: 'walk', label: 'Marche', icon: '🚶' },
  { value: 'tramway', label: 'Tramway', icon: '🚋' },
  { value: 'bus', label: 'Bus', icon: '🚌' },
  { value: 'bike', label: 'Vélo', icon: '🚲' },
  { value: 'scooter', label: 'Trottinette', icon: '🛴' },
  { value: 'navibus', label: 'Navibus', icon: '⛴️' },
  { value: 'train', label: 'Train', icon: '🚆' },
]

// ── Helpers ──────────────────────────────────────────────────────────────────

function deriveName(email: string): string {
  const local = email.split('@')[0] ?? ''
  return local
    .replace(/[._-]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

// ── Sub-components ───────────────────────────────────────────────────────────

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: () => void
  label: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={[
        'relative shrink-0 w-12 h-7 rounded-full transition-colors duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-eco',
        checked ? 'bg-accent-eco' : 'bg-border-strong',
      ].join(' ')}
    >
      <span
        aria-hidden="true"
        className={[
          'absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow-sm',
          'transition-transform duration-200',
          checked ? 'translate-x-5' : 'translate-x-0',
        ].join(' ')}
      />
    </button>
  )
}

// ── Skeleton ─────────────────────────────────────────────────────────────────

function ProfileSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Chargement du profil">
      <div className="bg-bg-card rounded-card p-4 space-y-3">
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="skeleton h-14 rounded-xl" />
        ))}
      </div>
      <div className="bg-bg-card rounded-card p-4">
        <div className="skeleton h-14 rounded-xl" />
      </div>
      <div className="bg-bg-card rounded-card p-4">
        <div className="skeleton h-16 rounded-xl" />
      </div>
    </div>
  )
}

// ── ProfileForm ───────────────────────────────────────────────────────────────

interface FormState {
  preference: UserPreference
  modes: TransportMode[]
  maxWalkMinutes: number
  pmrAccessibility: boolean
}

function ProfileForm({ profile }: { profile: MobilityProfile }) {
  const updateProfile = useProfileStore((s) => s.updateProfile)
  const radioGroupRef = useRef<HTMLDivElement>(null)

  const [form, setForm] = useState<FormState>({
    preference: profile.preference,
    modes: profile.preferredModes,
    maxWalkMinutes: Math.max(5, profile.maxWalkMinutes),
    pmrAccessibility: profile.pmrAccessibility,
  })

  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  function handleRadioKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return
    e.preventDefault()
    const currentIndex = PREF_OPTIONS.findIndex((opt) => opt.value === form.preference)
    const delta = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1
    const nextIndex = (currentIndex + delta + PREF_OPTIONS.length) % PREF_OPTIONS.length
    const nextValue = PREF_OPTIONS[nextIndex].value
    setForm((f) => ({ ...f, preference: nextValue }))
    const buttons = radioGroupRef.current?.querySelectorAll<HTMLButtonElement>('[role="radio"]')
    buttons?.[nextIndex]?.focus()
  }

  function toggleMode(mode: TransportMode) {
    setForm((prev) => {
      const { modes } = prev
      if (modes.includes(mode)) {
        if (modes.length === 1) return prev
        return { ...prev, modes: modes.filter((m) => m !== mode) }
      }
      return { ...prev, modes: [...modes, mode] }
    })
  }

  async function handleSave() {
    setIsSaving(true)
    setSaveError(null)
    setSaveSuccess(false)
    try {
      await updateProfile({
        preference: form.preference,
        preferredModes: form.modes,
        maxWalkMinutes: form.maxWalkMinutes,
        pmrAccessibility: form.pmrAccessibility,
      })
      setSaveSuccess(true)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* ── Modes de transport ─────────────────────────────────────────── */}
      <section aria-labelledby="modes-heading">
        <h2
          id="modes-heading"
          className="text-h3 font-semibold text-accent-eco mb-3 px-1"
        >
          Modes de transport
        </h2>
        <div
          role="group"
          aria-labelledby="modes-heading"
          className="bg-bg-card rounded-card divide-y divide-border overflow-hidden"
        >
          {MODE_OPTIONS.map((mode) => {
            const isSelected = form.modes.includes(mode.value)
            const isOnlyMode = form.modes.length === 1 && isSelected
            const color = MODE_COLORS[mode.value]
            return (
              <div
                key={mode.value}
                className="flex items-center gap-3 px-4 py-3.5"
              >
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-base shrink-0"
                  style={{ background: `${color}28` }}
                  aria-hidden="true"
                >
                  {mode.icon}
                </div>
                <span className="flex-1 text-body text-text-primary">{mode.label}</span>
                <Toggle
                  checked={isSelected}
                  onChange={() => !isOnlyMode && toggleMode(mode.value)}
                  label={`${isSelected ? 'Désactiver' : 'Activer'} le mode ${mode.label}`}
                />
              </div>
            )
          })}

          {/* PMR row */}
          <div className="flex items-center gap-3 px-4 py-3.5">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-base shrink-0"
              style={{ background: '#60a5fa28' }}
              aria-hidden="true"
            >
              ♿
            </div>
            <span className="flex-1 text-body text-text-primary">Accessibilité PMR</span>
            <Toggle
              checked={form.pmrAccessibility}
              onChange={() => setForm((f) => ({ ...f, pmrAccessibility: !f.pmrAccessibility }))}
              label={`Accessibilité PMR ${form.pmrAccessibility ? 'activée' : 'désactivée'}`}
            />
          </div>
        </div>
      </section>

      {/* ── Priorité itinéraire ────────────────────────────────────────── */}
      <section aria-labelledby="pref-heading">
        <h2
          id="pref-heading"
          className="text-h3 font-semibold text-accent-eco mb-3 px-1"
        >
          Priorité itinéraire
        </h2>
        <div
          ref={radioGroupRef}
          role="radiogroup"
          aria-labelledby="pref-heading"
          className="bg-bg-elevated rounded-[14px] p-1 flex gap-1"
          onKeyDown={handleRadioKeyDown}
        >
          {PREF_OPTIONS.map((opt) => {
            const isSelected = form.preference === opt.value
            return (
              <button
                key={opt.value}
                type="button"
                role="radio"
                aria-checked={isSelected}
                tabIndex={isSelected ? 0 : -1}
                onClick={() => setForm((f) => ({ ...f, preference: opt.value }))}
                className={[
                  'flex-1 py-2.5 rounded-[10px] text-body-sm font-semibold transition-colors duration-fast',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-eco focus-visible:ring-inset',
                  isSelected ? 'bg-accent-eco' : 'text-text-muted hover:text-text-secondary',
                ].join(' ')}
                style={isSelected ? { color: '#052e16' } : undefined}
              >
                {opt.label}
              </button>
            )
          })}
        </div>
      </section>

      {/* ── Marche maximum ────────────────────────────────────────────── */}
      <section aria-labelledby="walk-heading">
        <h2
          id="walk-heading"
          className="text-h3 font-semibold text-accent-eco mb-3 px-1"
        >
          Marche maximum
        </h2>
        <div className="bg-bg-card rounded-card px-4 py-3.5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-body text-text-primary">Marche maximum</span>
            <span
              className="text-body font-semibold text-accent-eco tabular-nums"
              aria-live="polite"
              aria-atomic="true"
            >
              {form.maxWalkMinutes} min
            </span>
          </div>

          <label htmlFor="max-walk" className="sr-only">
            Temps de marche maximum en minutes
          </label>
          <input
            id="max-walk"
            type="range"
            min={5}
            max={60}
            step={5}
            value={form.maxWalkMinutes}
            onChange={(e) => setForm((f) => ({ ...f, maxWalkMinutes: Number(e.target.value) }))}
            className="w-full h-1.5 cursor-pointer accent-accent-eco rounded-full"
            aria-valuemin={5}
            aria-valuemax={60}
            aria-valuenow={form.maxWalkMinutes}
            aria-valuetext={`${form.maxWalkMinutes} minutes`}
          />
          <div
            className="flex justify-between text-caption text-text-muted mt-2"
            aria-hidden="true"
          >
            <span>5 min</span>
            <span>30 min</span>
            <span>60 min</span>
          </div>
        </div>
      </section>

      {/* ── Feedback sauvegarde ──────────────────────────────────────── */}
      <div role="status" aria-live="polite" aria-atomic="true" className="min-h-[3rem]">
        {saveSuccess && (
          <div className="bg-bg-elevated border border-accent-eco rounded-card px-4 py-3 text-accent-eco text-body-sm flex items-center gap-2 animate-fade-in">
            <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z" />
            </svg>
            Préférences enregistrées
          </div>
        )}
        {saveError && (
          <div
            role="alert"
            className="bg-bg-elevated border border-accent-error rounded-card px-4 py-3 text-accent-error text-body-sm"
          >
            {saveError}
          </div>
        )}
      </div>

      {/* ── Bouton enregistrer ───────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => void handleSave()}
        className="btn-primary w-full"
        disabled={isSaving}
        aria-busy={isSaving}
      >
        {isSaving ? (
          <>
            <span
              aria-hidden="true"
              className="inline-block w-4 h-4 border-2 rounded-full animate-spin"
              style={{ borderColor: 'rgba(5,46,22,0.25)', borderTopColor: '#052e16' }}
            />
            Enregistrement…
          </>
        ) : (
          'Enregistrer mes préférences'
        )}
      </button>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const profile = useProfileStore((s) => s.profile)
  const isLoading = useProfileStore((s) => s.isLoading)
  const fetchError = useProfileStore((s) => s.error)
  const fetchProfile = useProfileStore((s) => s.fetchProfile)

  const authUser = useAuthStore((s) => s.user)

  const newlyUnlocked = useGamificationStore((s) => s.newlyUnlockedBadges)
  const clearNewlyUnlocked = useGamificationStore((s) => s.clearNewlyUnlockedBadges)

  const [badges, setBadges] = useState<BadgeWithStatus[]>([])
  const [badgesLoading, setBadgesLoading] = useState(true)

  useEffect(() => {
    void fetchProfile()
  }, [fetchProfile])

  useEffect(() => {
    getUserBadges()
      .then(setBadges)
      .catch(() => { /* badges non critiques */ })
      .finally(() => setBadgesLoading(false))
  }, [])

  useEffect(() => {
    if (newlyUnlocked.length === 0 || badgesLoading) return
    const t = setTimeout(clearNewlyUnlocked, 2000)
    return () => clearTimeout(t)
  }, [newlyUnlocked, badgesLoading, clearNewlyUnlocked])

  const isInitialLoading = !profile && isLoading

  const email = authUser?.email ?? ''
  const displayName = email ? deriveName(email) : 'Utilisateur'
  const initial = displayName.charAt(0).toUpperCase()

  return (
    <div className="flex flex-col h-screen bg-bg-base">
      {/* ── Header ────────────────────────────────────────────────────────── */}
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
        <h1 className="text-h2 font-bold text-text-primary">Mon profil</h1>
      </header>

      {/* ── Contenu scrollable ─────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 pb-8 space-y-6">
          {/* ── User card ─────────────────────────────────────────────────── */}
          {email && (
            <div className="bg-bg-card rounded-card p-4 flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-full bg-accent-eco flex items-center justify-center shrink-0 text-h2 font-bold"
                style={{ color: '#052e16' }}
                aria-hidden="true"
              >
                {initial}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-body font-semibold text-text-primary">{displayName}</p>
                <p className="text-body-sm text-text-muted truncate">{email}</p>
              </div>
            </div>
          )}

          {/* ── Erreur de chargement ──────────────────────────────────────── */}
          {fetchError && !profile && (
            <div
              role="alert"
              className="bg-bg-elevated border border-accent-error rounded-card px-4 py-3 text-accent-error text-body-sm"
            >
              {fetchError}
            </div>
          )}

          {/* ── Form ─────────────────────────────────────────────────────── */}
          {isInitialLoading ? (
            <ProfileSkeleton />
          ) : profile ? (
            <ProfileForm profile={profile} />
          ) : null}

          {/* ── Badges ───────────────────────────────────────────────────── */}
          <div className="mt-2">
            <BadgeGrid badges={badges} newlyUnlocked={newlyUnlocked} loading={badgesLoading} />
          </div>
        </div>
      </main>

      {/* ── Bottom Navigation ─────────────────────────────────────────────── */}
      <BottomNav />
    </div>
  )
}
