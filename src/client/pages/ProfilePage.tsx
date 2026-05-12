import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useProfileStore } from '../stores/profile.store'
import type { TransportMode, UserPreference } from '@shared/types/index'

// ─── Config des options ───────────────────────────────────────────────────────

const PREF_OPTIONS: Array<{
  value: UserPreference
  label: string
  description: string
  icon: string
  selectedBg: string
  selectedBorder: string
  selectedText: string
}> = [
  {
    value: 'eco',
    label: 'Éco',
    description: 'Priorité au CO₂ économisé',
    icon: '🌱',
    selectedBg: 'bg-eco-50',
    selectedBorder: 'border-eco-600',
    selectedText: 'text-eco-700',
  },
  {
    value: 'balanced',
    label: 'Équilibré',
    description: 'Durée et empreinte carbone',
    icon: '⚖️',
    selectedBg: 'bg-slate-100',
    selectedBorder: 'border-slate-500',
    selectedText: 'text-slate-700',
  },
  {
    value: 'fast',
    label: 'Rapide',
    description: 'Priorité à la durée totale',
    icon: '⚡',
    selectedBg: 'bg-transit-50',
    selectedBorder: 'border-transit-600',
    selectedText: 'text-transit-700',
  },
]

const MODE_OPTIONS: Array<{
  value: TransportMode
  label: string
  icon: string
  selectedBg: string
  selectedBorder: string
  selectedText: string
}> = [
  {
    value: 'walk',
    label: 'Marche',
    icon: '🚶',
    selectedBg: 'bg-slate-100',
    selectedBorder: 'border-slate-500',
    selectedText: 'text-slate-700',
  },
  {
    value: 'bike',
    label: 'Vélo',
    icon: '🚲',
    selectedBg: 'bg-eco-50',
    selectedBorder: 'border-eco-600',
    selectedText: 'text-eco-700',
  },
  {
    value: 'tramway',
    label: 'Tramway',
    icon: '🚋',
    selectedBg: 'bg-transit-50',
    selectedBorder: 'border-transit-600',
    selectedText: 'text-transit-700',
  },
  {
    value: 'bus',
    label: 'Bus',
    icon: '🚌',
    selectedBg: 'bg-amber-50',
    selectedBorder: 'border-amber-600',
    selectedText: 'text-amber-700',
  },
]

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function ProfileSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Chargement du profil">
      <div className="card p-4 lg:p-6">
        <div className="skeleton h-6 w-56 rounded mb-2" />
        <div className="skeleton h-4 w-72 rounded mb-4" />
        <div className="grid grid-cols-3 gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton h-24 rounded-card" />
          ))}
        </div>
      </div>
      <div className="card p-4 lg:p-6">
        <div className="skeleton h-6 w-64 rounded mb-2" />
        <div className="skeleton h-4 w-48 rounded mb-4" />
        <div className="flex gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-12 w-28 rounded-button" />
          ))}
        </div>
      </div>
      <div className="card p-4 lg:p-6">
        <div className="skeleton h-6 w-56 rounded mb-2" />
        <div className="skeleton h-4 rounded-full w-full mt-6" />
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const profile = useProfileStore((s) => s.profile)
  const isLoading = useProfileStore((s) => s.isLoading)
  const fetchError = useProfileStore((s) => s.error)
  const fetchProfile = useProfileStore((s) => s.fetchProfile)
  const updateProfile = useProfileStore((s) => s.updateProfile)

  const [localPreference, setLocalPreference] = useState<UserPreference>('balanced')
  const [localModes, setLocalModes] = useState<TransportMode[]>(['walk', 'tramway', 'bus'])
  const [localMaxWalk, setLocalMaxWalk] = useState(15)
  const [localPmr, setLocalPmr] = useState(false)

  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    void fetchProfile()
  }, [fetchProfile])

  // Synchronise le formulaire local quand le profil arrive depuis le store
  useEffect(() => {
    if (profile) {
      setLocalPreference(profile.preference)
      setLocalModes(profile.preferredModes)
      setLocalMaxWalk(profile.maxWalkMinutes)
      setLocalPmr(profile.pmrAccessibility)
    }
  }, [profile])

  function toggleMode(mode: TransportMode) {
    setLocalModes((prev) => {
      if (prev.includes(mode)) {
        if (prev.length === 1) return prev
        return prev.filter((m) => m !== mode)
      }
      return [...prev, mode]
    })
  }

  async function handleSave() {
    setIsSaving(true)
    setSaveError(null)
    setSaveSuccess(false)
    try {
      await updateProfile({
        preference: localPreference,
        preferredModes: localModes,
        maxWalkMinutes: localMaxWalk,
        pmrAccessibility: localPmr,
      })
      setSaveSuccess(true)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde')
    } finally {
      setIsSaving(false)
    }
  }

  const isInitialLoading = !profile && isLoading

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-navbar">
        <div className="max-w-2xl mx-auto flex items-center gap-3 px-4 h-16">
          <Link
            to="/"
            aria-label="Retour à la carte"
            className="shrink-0 w-12 h-12 flex items-center justify-center rounded-button text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors duration-fast"
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
          <h1 className="text-h2 font-bold text-slate-900">Mon profil de mobilité</h1>
        </div>
      </header>

      {/* ── Contenu principal ────────────────────────────────────────────────── */}
      <main className="max-w-2xl mx-auto px-4 py-6 lg:px-6 space-y-6">

        {/* Erreur de chargement */}
        {fetchError && !profile && (
          <div role="alert" className="bg-red-50 border border-red-200 rounded-card px-4 py-3 text-red-700 text-body-sm">
            {fetchError}
          </div>
        )}

        {isInitialLoading ? (
          <ProfileSkeleton />
        ) : (
          <>
            {/* ── Section 1 : Mode préféré ──────────────────────────────────── */}
            <section className="card p-4 lg:p-6" aria-labelledby="pref-heading">
              <h2 id="pref-heading" className="text-h3 font-semibold text-slate-900">
                Mode de déplacement préféré
              </h2>
              <p className="text-body-sm text-slate-500 mt-0.5 mb-4">
                Influence le classement des itinéraires proposés
              </p>

              <div
                role="radiogroup"
                aria-labelledby="pref-heading"
                className="grid grid-cols-3 gap-3"
              >
                {PREF_OPTIONS.map((opt) => {
                  const isSelected = localPreference === opt.value
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      onClick={() => setLocalPreference(opt.value)}
                      className={[
                        'flex flex-col items-center text-center gap-1.5 p-3 rounded-card border-2 w-full',
                        'transition-colors duration-fast',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eco-600 focus-visible:ring-offset-2',
                        isSelected
                          ? `${opt.selectedBg} ${opt.selectedBorder} ${opt.selectedText}`
                          : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50',
                      ].join(' ')}
                    >
                      <span aria-hidden="true" className="text-2xl leading-none">{opt.icon}</span>
                      <span className="text-body-sm font-semibold">{opt.label}</span>
                      <span className="text-caption leading-snug">{opt.description}</span>
                    </button>
                  )
                })}
              </div>
            </section>

            {/* ── Section 2 : Modes acceptés ───────────────────────────────── */}
            <section className="card p-4 lg:p-6" aria-labelledby="modes-heading">
              <h2 id="modes-heading" className="text-h3 font-semibold text-slate-900">
                Modes de transport acceptés
              </h2>
              <p className="text-body-sm text-slate-500 mt-0.5 mb-4">
                Sélectionnez au moins un mode
              </p>

              <div
                role="group"
                aria-labelledby="modes-heading"
                className="flex flex-wrap gap-3"
              >
                {MODE_OPTIONS.map((mode) => {
                  const isSelected = localModes.includes(mode.value)
                  const isOnlyMode = localModes.length === 1 && isSelected
                  return (
                    <button
                      key={mode.value}
                      type="button"
                      aria-pressed={isSelected}
                      aria-disabled={isOnlyMode}
                      onClick={() => toggleMode(mode.value)}
                      title={isOnlyMode ? 'Au moins un mode requis' : undefined}
                      className={[
                        'inline-flex items-center gap-2 px-4 rounded-button border-2 text-body-sm font-medium',
                        'transition-colors duration-fast',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eco-600 focus-visible:ring-offset-2',
                        isOnlyMode ? 'opacity-60 cursor-not-allowed' : '',
                        isSelected
                          ? `${mode.selectedBg} ${mode.selectedBorder} ${mode.selectedText}`
                          : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50',
                      ].join(' ')}
                    >
                      <span aria-hidden="true">{mode.icon}</span>
                      {mode.label}
                    </button>
                  )
                })}
              </div>
            </section>

            {/* ── Section 3 : Accessibilité PMR ───────────────────────────── */}
            <section className="card p-4 lg:p-6" aria-labelledby="pmr-heading">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 id="pmr-heading" className="text-h3 font-semibold text-slate-900">
                    Accessibilité PMR
                  </h2>
                  <p className="text-body-sm text-slate-500 mt-0.5">
                    Filtre les itinéraires selon l'accessibilité des arrêts et des véhicules
                  </p>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={localPmr}
                  aria-labelledby="pmr-heading"
                  onClick={() => setLocalPmr((v) => !v)}
                  className={[
                    'relative shrink-0 w-12 h-7 rounded-full border-2 transition-colors duration-fast',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eco-600 focus-visible:ring-offset-2',
                    localPmr
                      ? 'bg-eco-600 border-eco-600'
                      : 'bg-slate-200 border-slate-200',
                  ].join(' ')}
                >
                  <span
                    aria-hidden="true"
                    className={[
                      'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm',
                      'transition-transform duration-fast',
                      localPmr ? 'translate-x-5' : 'translate-x-0',
                    ].join(' ')}
                  />
                  <span className="sr-only">{localPmr ? 'Activé' : 'Désactivé'}</span>
                </button>
              </div>
            </section>

            {/* ── Section 4 : Temps de marche max ─────────────────────────── */}
            <section className="card p-4 lg:p-6" aria-labelledby="walk-heading">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 id="walk-heading" className="text-h3 font-semibold text-slate-900">
                    Temps de marche maximum
                  </h2>
                  <p className="text-body-sm text-slate-500 mt-0.5">
                    Entre votre position et l'arrêt le plus proche
                  </p>
                </div>
                <span
                  aria-live="polite"
                  aria-atomic="true"
                  className="text-display font-bold text-eco-700 leading-none ml-4 shrink-0"
                >
                  {localMaxWalk} min
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
                value={localMaxWalk}
                onChange={(e) => setLocalMaxWalk(Number(e.target.value))}
                className="w-full h-2 cursor-pointer accent-eco-600"
                aria-valuemin={5}
                aria-valuemax={60}
                aria-valuenow={localMaxWalk}
                aria-valuetext={`${localMaxWalk} minutes`}
              />
              <div
                className="flex justify-between text-caption text-slate-400 mt-2"
                aria-hidden="true"
              >
                <span>5 min</span>
                <span>30 min</span>
                <span>60 min</span>
              </div>
            </section>
          </>
        )}

        {/* ── Feedback sauvegarde ──────────────────────────────────────────── */}
        <div role="status" aria-live="polite" aria-atomic="true" className="min-h-[3rem]">
          {saveSuccess && (
            <div className="bg-eco-50 border border-eco-200 rounded-card px-4 py-3 text-eco-700 text-body-sm flex items-center gap-2 animate-fade-in">
              <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z" />
              </svg>
              Préférences enregistrées
            </div>
          )}
          {saveError && (
            <div role="alert" className="bg-red-50 border border-red-200 rounded-card px-4 py-3 text-red-700 text-body-sm">
              {saveError}
            </div>
          )}
        </div>

        {/* ── Bouton enregistrer ───────────────────────────────────────────── */}
        <button
          type="button"
          onClick={() => void handleSave()}
          className="btn-primary w-full"
          disabled={isSaving || isInitialLoading}
          aria-busy={isSaving}
        >
          {isSaving ? (
            <>
              <span
                aria-hidden="true"
                className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
              />
              Enregistrement…
            </>
          ) : (
            'Enregistrer mes préférences'
          )}
        </button>
      </main>
    </div>
  )
}
