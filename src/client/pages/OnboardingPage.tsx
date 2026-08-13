import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProfileStore } from '../stores/profile.store'
import { useAuthStore } from '../stores/auth.store'
import { useInstallPrompt } from '../hooks/use-install-prompt'
import { useAppCacheSize } from '../hooks/use-app-cache-size'
import { isIosDevice } from '../utils/platform'
import { GuestLocked } from '../components/GuestLocked'
import { ModeChip } from '../components/ModeChip'
import { PROFILE_PRESETS } from '../constants/profile-presets'
import urbanflowIcon from '../assets/urbanflow-icon.svg'
import type { TransportMode, UserPreference } from '@shared/types/index'

const ONBOARDING_MODES: TransportMode[] = [
  'walk',
  'bike',
  'tramway',
  'bus',
  'scooter',
  'navibus',
  'train',
]
const DEFAULT_MODES: TransportMode[] = ['walk', 'bike', 'tramway', 'bus']

/** Onboarding préférences + PWA — étape 2 sur 2 (étape 1 = inscription).
 * MAQUETTE.md §5.1 : profil par défaut, modes utilisés, bannière PWA discrète.
 * Écart assumé avec la maquette : le header "Progression Étape 2 sur 2"
 * (bouton retour + barre de progression) a été retiré sur instruction directe
 * du product owner — ne pas le réintroduire en relisant MAQUETTE.md. */
export default function OnboardingPage() {
  const navigate = useNavigate()
  const updateProfile = useProfileStore((s) => s.updateProfile)
  const isGuest = useAuthStore((s) => s.isGuest)
  const { canInstall, isInstalled, promptInstall } = useInstallPrompt()
  const isIOS = isIosDevice()
  const appCacheSize = useAppCacheSize()

  const [preference, setPreference] = useState<UserPreference>('eco')
  const [modes, setModes] = useState<TransportMode[]>(DEFAULT_MODES)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const radioGroupRef = useRef<HTMLDivElement>(null)

  function toggleMode(mode: TransportMode) {
    setModes((prev) => {
      if (prev.includes(mode)) {
        if (prev.length === 1) return prev
        return prev.filter((m) => m !== mode)
      }
      return [...prev, mode]
    })
  }

  function handleRadioKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return
    e.preventDefault()
    const currentIndex = PROFILE_PRESETS.findIndex((opt) => opt.value === preference)
    const delta = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1
    const nextIndex = (currentIndex + delta + PROFILE_PRESETS.length) % PROFILE_PRESETS.length
    setPreference(PROFILE_PRESETS[nextIndex].value)
    const buttons = radioGroupRef.current?.querySelectorAll<HTMLButtonElement>('[role="radio"]')
    buttons?.[nextIndex]?.focus()
  }

  async function handleStart() {
    setIsSaving(true)
    setError(null)
    try {
      await updateProfile({
        preference,
        preferredModes: modes,
        maxWalkMinutes: 15,
        pmrAccessibility: false,
      })
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <main className="min-h-dvh bg-bg flex flex-col lg:flex-row">
      {/* Pas de maquette desktop pour l'onboarding — même parti pris que AuthShell
       * (cf. son commentaire) : un panneau de marque pleine hauteur plutôt qu'une
       * carte mobile recentrée perdue dans le vide. */}
      <div className="hidden lg:flex lg:w-2/5 lg:min-w-95 lg:flex-col lg:justify-center lg:gap-2 lg:p-16 bg-primary">
        <img src={urbanflowIcon} alt="" width={40} height={40} className="w-14 h-14" />
        <span className="text-display font-bold text-on-primary tracking-tight">UrbanFlow</span>
        <span className="text-body-lg text-on-primary-muted max-w-xs">
          Votre profil de mobilité, en une étape
        </span>
      </div>

      <div className="flex-1 flex flex-col p-5 gap-4 bg-surface lg:justify-center lg:p-16">
        {/* `contents` : sur mobile ce wrapper disparaît de la boîte, ses enfants
         * héritent du flex column + gap-4 du parent (structure mobile inchangée).
         * En lg il redevient une vraie colonne centrée max-w-sm, comme AuthShell. */}
        <div className="contents lg:flex lg:flex-col lg:gap-4 lg:w-full lg:max-w-sm lg:mx-auto">
          <div>
            <h1 className="text-h3 font-bold tracking-tight mb-1.5">
              Comment préférez-vous vous déplacer ?
            </h1>
            <p className="text-body-sm text-text-muted">
              Ce sera votre réglage par défaut. Modifiable à chaque recherche.
            </p>
          </div>

          <GuestLocked
            active={isGuest}
            title="Créez un compte pour continuer"
            description="Connectez-vous ou créez un compte gratuitement pour enregistrer votre profil de mobilité."
            className="flex-1 flex flex-col min-h-0"
          >
            <div className="flex-1 flex flex-col gap-4 min-h-0">
              <div
                ref={radioGroupRef}
                role="radiogroup"
                aria-label="Profil par défaut"
                className="flex flex-col gap-2"
                onKeyDown={handleRadioKeyDown}
              >
                {PROFILE_PRESETS.map((opt) => {
                  const isSelected = preference === opt.value
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      tabIndex={isSelected ? 0 : -1}
                      onClick={() => setPreference(opt.value)}
                      className={[
                        'flex items-center gap-3 p-3.5 rounded-xl border text-left transition-colors duration-fast',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary',
                        isSelected
                          ? 'border-[1.5px] border-primary bg-primary-surface'
                          : 'border-border',
                      ].join(' ')}
                    >
                      <svg
                        aria-hidden="true"
                        width="22"
                        height="22"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.75"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={
                          isSelected ? 'text-primary shrink-0' : 'text-text-muted shrink-0'
                        }
                      >
                        {opt.icon}
                      </svg>
                      <span className="flex-1 flex flex-col gap-0.5">
                        <span className="text-body-sm font-bold">{opt.label}</span>
                        <span className="text-caption text-text-muted">{opt.description}</span>
                      </span>
                      <span
                        aria-hidden="true"
                        className={[
                          'size-6 rounded-full flex items-center justify-center shrink-0',
                          isSelected ? 'bg-primary' : 'border-2 border-border',
                        ].join(' ')}
                      >
                        {isSelected && (
                          <svg
                            width="13"
                            height="13"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-on-primary"
                          >
                            <path d="M20 6L9 17l-5-5" />
                          </svg>
                        )}
                      </span>
                    </button>
                  )
                })}
              </div>

              <div>
                <span className="block text-caption font-bold tracking-[0.06em] uppercase text-text-subtle mb-2">
                  Modes que vous utilisez
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {ONBOARDING_MODES.map((mode) => (
                    <ModeChip
                      key={mode}
                      mode={mode}
                      selected={modes.includes(mode)}
                      onClick={() => toggleMode(mode)}
                    />
                  ))}
                </div>
              </div>

              <div role="alert" aria-live="polite" className="min-h-0">
                {error && <p className="text-body-sm text-danger-text">{error}</p>}
              </div>

              <div className="mt-auto flex flex-col gap-2.5 lg:mt-0">
                <div className="flex items-center gap-3 p-3.5 rounded-xl bg-surface-sunken">
                  <svg
                    aria-hidden="true"
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-text shrink-0"
                  >
                    <rect x="6" y="2.5" width="12" height="19" rx="2.5" />
                    <path d="M12 6v7M9 10l3 3 3-3" />
                  </svg>
                  <span className="flex-1 flex flex-col gap-0.5">
                    <span className="text-body-sm font-semibold">Installer UrbanFlow</span>
                    <span className="text-caption text-text-muted">
                      {!isInstalled && !canInstall && isIOS
                        ? 'Partager → Sur l’écran d’accueil'
                        : appCacheSize
                          ? `Accès hors-ligne aux derniers itinéraires · ${appCacheSize}`
                          : 'Accès hors-ligne aux derniers itinéraires'}
                    </span>
                  </span>
                  {canInstall && (
                    <button
                      type="button"
                      onClick={() => void promptInstall()}
                      className="shrink-0 h-9 px-3.5 rounded-md bg-text text-bg text-caption font-semibold"
                    >
                      Installer
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => void handleStart()}
                  className="btn-primary w-full"
                  disabled={isSaving}
                  aria-busy={isSaving}
                >
                  {isSaving ? (
                    <>
                      <span
                        aria-hidden="true"
                        className="inline-block w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin"
                      />
                      Enregistrement…
                    </>
                  ) : (
                    'Commencer'
                  )}
                </button>
              </div>
            </div>
          </GuestLocked>
        </div>
      </div>
    </main>
  )
}
