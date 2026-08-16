import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useProfileStore } from '../stores/profile.store'
import { useAuthStore } from '../stores/auth.store'
import { useGuestSafeEffect } from '../hooks/use-guest-safe-effect'
import { GuestLocked } from '../components/GuestLocked'
import { ModeChip } from '../components/ModeChip'
import { PageHeader } from '../components/PageHeader'
import { PageWithSidebar } from '../components/PageWithSidebar'
import { Slider } from '../components/Slider'
import { PROFILE_PRESETS } from '../constants/profile-presets'
import { GUEST_PROFILE } from '../constants/guest-fake-data'
import { TRANSPORT_MODES } from '@shared/types/index'
import type { MobilityProfile, TransportMode, UserPreference } from '@shared/types/index'
import { SCORING_WEIGHTS } from '@shared/constants/scoring-weights'

function formatWeight(value: number): string {
  return value.toLocaleString('fr-FR')
}

// ─── Squelette ────────────────────────────────────────────────────────────────

function ProfileSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true" aria-label="Chargement du profil">
      <div className="skeleton h-12 rounded-full" />
      <div className="skeleton h-24 rounded-xl" />
      <div className="skeleton h-40 rounded-xl" />
      <div className="skeleton h-52 rounded-xl" />
    </div>
  )
}

// ─── Formulaire (auto-save, pas de bouton Enregistrer) ─────────────────────────

interface FormState {
  preference: UserPreference
  modes: TransportMode[]
  maxWalkMinutes: number
  pmrAccessibility: boolean
}

function ProfileForm({ profile, isGuest }: { profile: MobilityProfile; isGuest: boolean }) {
  const updateProfile = useProfileStore((s) => s.updateProfile)
  const radioGroupRef = useRef<HTMLDivElement>(null)

  const initialForm: FormState = {
    preference: profile.preference,
    modes: profile.preferredModes,
    maxWalkMinutes: Math.max(5, profile.maxWalkMinutes),
    pmrAccessibility: profile.pmrAccessibility,
  }
  const [form, setForm] = useState<FormState>(initialForm)

  const initialFormRef = useRef(initialForm)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Sauvegarde automatique, débattue, à chaque changement (MAQUETTE.md §5.3 :
  // "pas de bouton Enregistrer — bandeau Enregistré automatiquement"). Ne
  // sauvegarde jamais pour un invité — profil fictif, pas de compte serveur
  // (le PUT authentifié 401'd déclencherait un clearAuth() qui l'éjecterait,
  // même piège que fetchProfile ailleurs dans cette fonctionnalité).
  useEffect(() => {
    if (isGuest) return
    if (JSON.stringify(form) === JSON.stringify(initialFormRef.current)) return
    const timer = setTimeout(() => {
      updateProfile({
        preference: form.preference,
        preferredModes: form.modes,
        maxWalkMinutes: form.maxWalkMinutes,
        pmrAccessibility: form.pmrAccessibility,
      }).catch((err: unknown) => {
        setSaveError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde')
      })
    }, 500)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, isGuest])

  function handleRadioKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return
    e.preventDefault()
    const currentIndex = PROFILE_PRESETS.findIndex((opt) => opt.value === form.preference)
    const delta = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1
    const nextIndex = (currentIndex + delta + PROFILE_PRESETS.length) % PROFILE_PRESETS.length
    const nextValue = PROFILE_PRESETS[nextIndex].value
    setForm((f) => ({ ...f, preference: nextValue }))
    setSaveError(null)
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
    setSaveError(null)
  }

  const weights = SCORING_WEIGHTS[form.preference]

  return (
    <div className="flex flex-col gap-4">
      {/* ── Profil par défaut ──────────────────────────────────────────── */}
      <div className="flex flex-col gap-2">
        <span className="text-caption font-bold tracking-[0.06em] uppercase text-text-subtle">
          Profil par défaut
        </span>
        <div
          ref={radioGroupRef}
          role="radiogroup"
          aria-label="Profil par défaut"
          className="flex gap-1.5 p-1 bg-surface-sunken rounded-full"
          onKeyDown={handleRadioKeyDown}
        >
          {PROFILE_PRESETS.map((opt) => {
            const isSelected = form.preference === opt.value
            return (
              <button
                key={opt.value}
                type="button"
                role="radio"
                aria-checked={isSelected}
                tabIndex={isSelected ? 0 : -1}
                onClick={() => {
                  setForm((f) => ({ ...f, preference: opt.value }))
                  setSaveError(null)
                }}
                className={[
                  'flex-1 h-11 rounded-full flex items-center justify-center gap-1.5 text-body-sm font-semibold transition-colors duration-fast',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary',
                  isSelected ? 'bg-primary text-on-primary' : 'text-text',
                ].join(' ')}
              >
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
                  {opt.icon}
                </svg>
                {opt.label}
              </button>
            )
          })}
        </div>
        <span className="text-caption text-text-muted">
          Poids appliqué : CO₂ {formatWeight(weights.co2)} · durée {formatWeight(weights.duration)}{' '}
          · confort {formatWeight(weights.comfort)}
        </span>
      </div>

      {/* ── Accessibilité ──────────────────────────────────────────────── */}
      <div className="flex flex-col gap-2">
        <span className="text-caption font-bold tracking-[0.06em] uppercase text-text-subtle">
          Accessibilité
        </span>
        <label className="flex items-center gap-3 p-3.5 rounded-xl bg-surface border border-border cursor-pointer">
          <svg
            aria-hidden="true"
            width="21"
            height="21"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-text-muted shrink-0"
          >
            <circle cx="12" cy="4" r="2" />
            <path d="M11 7v6h5l3 6M8.5 11a5 5 0 1 0 6.2 7.6" />
          </svg>
          <span className="flex-1 flex flex-col gap-0.5">
            <span className="text-body-sm font-semibold">Mode PMR par défaut</span>
            <span className="text-caption text-text-muted">
              {form.pmrAccessibility ? 'Activé' : 'Désactivé'} · reste accessible à chaque recherche
            </span>
          </span>
          <input
            type="checkbox"
            role="switch"
            aria-checked={form.pmrAccessibility}
            checked={form.pmrAccessibility}
            onChange={(e) => {
              setForm((f) => ({ ...f, pmrAccessibility: e.target.checked }))
              setSaveError(null)
            }}
            className="sr-only peer"
          />
          <span
            aria-hidden="true"
            className={[
              'shrink-0 w-11.5 h-7 rounded-full flex items-center p-0.75 transition-colors duration-fast',
              form.pmrAccessibility ? 'bg-primary justify-end' : 'bg-border justify-start',
            ].join(' ')}
          >
            <span className="size-5.5 rounded-full bg-surface" />
          </span>
        </label>
      </div>

      {/* ── Modes autorisés ─────────────────────────────────────────────── */}
      <div className="flex flex-col gap-2">
        <span className="text-caption font-bold tracking-[0.06em] uppercase text-text-subtle">
          Modes autorisés
        </span>
        <fieldset className="border-0 p-0 m-0 flex flex-wrap gap-1.5">
          <legend className="sr-only">Modes de transport autorisés</legend>
          {TRANSPORT_MODES.map((mode) => {
            const isSelected = form.modes.includes(mode)
            const isOnlyMode = form.modes.length === 1 && isSelected
            return (
              <ModeChip
                key={mode}
                mode={mode}
                selected={isSelected}
                size="sm"
                onClick={isOnlyMode ? undefined : () => toggleMode(mode)}
              />
            )
          })}
        </fieldset>
      </div>

      {/* ── Marche max ──────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 p-3.5 rounded-xl bg-surface border border-border">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between">
            <label htmlFor="max-walk" className="text-body-sm font-semibold">
              Marche max tolérée
            </label>
            <span className="text-body-sm font-bold text-primary tabular-nums">
              {form.maxWalkMinutes} min
            </span>
          </div>
          <Slider
            id="max-walk"
            min={5}
            max={25}
            step={1}
            value={form.maxWalkMinutes}
            onChange={(maxWalkMinutes) => {
              setForm((f) => ({ ...f, maxWalkMinutes }))
              setSaveError(null)
            }}
            ariaValueText={`${form.maxWalkMinutes} minutes`}
          />
          <div className="flex justify-between text-caption text-text-muted" aria-hidden="true">
            <span>5 min</span>
            <span>25 min</span>
          </div>
        </div>
      </div>

      {/* ── Statut de sauvegarde ───────────────────────────────────────── */}
      <div role="status" aria-live="polite" aria-atomic="true">
        {saveError ? (
          <p className="text-body-sm text-danger-text">{saveError}</p>
        ) : (
          <div className="flex items-center gap-2.5 p-2.5 rounded-md bg-surface-sunken">
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
              className="text-text-muted shrink-0"
            >
              <path d="M20 6L9 17l-5-5" />
            </svg>
            <span className="text-caption text-text-muted">
              Enregistré automatiquement · appliqué à la prochaine recherche
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const profile = useProfileStore((s) => s.profile)
  const isLoading = useProfileStore((s) => s.isLoading)
  const fetchError = useProfileStore((s) => s.error)
  const fetchProfile = useProfileStore((s) => s.fetchProfile)
  const user = useAuthStore((s) => s.user)
  const isGuest = useAuthStore((s) => s.isGuest)

  useGuestSafeEffect(fetchProfile, [fetchProfile])

  const isInitialLoading = !profile && isLoading
  const initials = user ? user.email.slice(0, 2).toUpperCase() : '?'
  const displayedProfile = isGuest ? GUEST_PROFILE : profile

  return (
    <PageWithSidebar>
      <div className="min-h-dvh bg-bg pb-[calc(var(--height-bottomnav)+1rem)] lg:pb-6">
        <PageHeader>
          <div className="max-w-2xl mx-auto flex items-center gap-3 px-4 h-16 lg:max-w-260">
            <span
              aria-hidden="true"
              className="shrink-0 size-11.5 rounded-full bg-primary-surface text-primary flex items-center justify-center text-body-sm font-bold"
            >
              {initials}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-body-sm font-bold truncate">{user?.email ?? 'Invité'}</p>
              <p className="text-caption text-text-muted">Profil de mobilité</p>
            </div>
            <Link to="/parametres" aria-label="Paramètres" className="btn-icon lg:hidden">
              <svg
                aria-hidden="true"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </Link>
          </div>
        </PageHeader>

        <main className="max-w-2xl mx-auto px-4 py-5 lg:px-6 lg:max-w-260">
          {fetchError && !profile && !isGuest && (
            <div
              role="alert"
              className="bg-danger-surface rounded-xl px-4 py-3 text-danger-text text-body-sm mb-4"
            >
              {fetchError}
            </div>
          )}

          {isInitialLoading ? (
            <ProfileSkeleton />
          ) : displayedProfile ? (
            <GuestLocked
              active={isGuest}
              title="Créez un compte pour accéder à votre profil"
              description="Connectez-vous ou créez un compte gratuitement pour régler vos préférences de mobilité."
            >
              <ProfileForm profile={displayedProfile} isGuest={isGuest} />
            </GuestLocked>
          ) : null}
        </main>
      </div>
    </PageWithSidebar>
  )
}
