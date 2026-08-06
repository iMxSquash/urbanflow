import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useConsentStore } from '../stores/consent.store'
import { useDemoStore } from '../stores/demo.store'
import { useThemeStore } from '../stores/theme.store'
import type { ThemePreference } from '../stores/theme.store'
import { useInstallPrompt } from '../hooks/useInstallPrompt'
import { DeleteAccountModal } from '../components/DeleteAccountModal'
import { exportUserData } from '../services/auth.service'
import LogoutButton from '../components/LogoutButton'
import { PageWithSidebar } from '../components/PageWithSidebar'
import type { Coordinates } from '@shared/types/index'

interface DemoScenario {
  fromLabel: string
  toLabel: string
  from: Coordinates
  to: Coordinates
  weather: 'sunny' | 'rainy'
  description: string
}

const DEMO_SCENARIOS: DemoScenario[] = [
  {
    fromLabel: 'Commerce',
    toLabel: 'Île de Nantes',
    from: { lat: 47.2134, lng: -1.5541 },
    to: { lat: 47.2005, lng: -1.554 },
    weather: 'sunny',
    description: 'Soleil · matin',
  },
  {
    fromLabel: 'Gare de Nantes',
    toLabel: 'Faculté des Sciences',
    from: { lat: 47.2181, lng: -1.5418 },
    to: { lat: 47.2628, lng: -1.5487 },
    weather: 'rainy',
    description: 'Pluie · heure de pointe',
  },
]

const THEME_OPTIONS: Array<{ value: ThemePreference; label: string }> = [
  { value: 'light', label: 'Clair' },
  { value: 'dark', label: 'Sombre' },
  { value: 'auto', label: 'Auto' },
]

function SettingsRow({
  icon,
  title,
  subtitle,
  action,
  border = true,
}: {
  icon: React.ReactNode
  title: string
  subtitle?: string
  action: React.ReactNode
  border?: boolean
}) {
  return (
    <div
      className={`flex items-center gap-3 px-3.5 py-3 ${border ? 'border-b border-surface-sunken' : ''}`}
    >
      <svg
        aria-hidden="true"
        width="19"
        height="19"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-text-muted shrink-0"
      >
        {icon}
      </svg>
      <span className="flex-1 flex flex-col gap-0.5 min-w-0">
        <span className="text-body-sm font-semibold">{title}</span>
        {subtitle && <span className="text-caption text-text-muted">{subtitle}</span>}
      </span>
      {action}
    </div>
  )
}

export default function ParametresPage() {
  const { geolocationConsent, denyGeolocation, resetGeolocation } = useConsentStore()
  const navigate = useNavigate()
  const {
    demoMode,
    providersDemo,
    weather,
    loading: demoLoading,
    fetch: fetchDemo,
    toggle,
    toggleProviders,
    setWeather,
  } = useDemoStore()
  const theme = useThemeStore((s) => s.theme)
  const setTheme = useThemeStore((s) => s.setTheme)
  const { canInstall, promptInstall } = useInstallPrompt()

  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)
  const themeGroupRef = useRef<HTMLSpanElement>(null)

  const geoGranted = geolocationConsent === 'granted'

  useEffect(() => {
    void fetchDemo()
  }, [fetchDemo])

  function handleRevokeGeo() {
    denyGeolocation()
  }

  function handleActivateGeo() {
    resetGeolocation()
    navigate('/')
  }

  async function handleExport() {
    setIsExporting(true)
    setExportError(null)
    try {
      await exportUserData()
    } catch (err) {
      setExportError(err instanceof Error ? err.message : "Impossible d'exporter vos données")
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <PageWithSidebar>
      <div className="min-h-screen bg-bg">
        <header className="bg-surface border-b border-border sticky top-0 z-navbar">
          <div className="max-w-2xl mx-auto flex items-center gap-3 px-4 h-16 lg:max-w-260">
            <Link to="/profile" aria-label="Retour au profil" className="btn-icon">
              <svg
                aria-hidden="true"
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </Link>
            <h1 className="text-h3 font-bold">Paramètres</h1>
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-4 py-4 flex flex-col gap-4 lg:max-w-260 lg:px-10 lg:py-8">
          {/* ── Mode démo ────────────────────────────────────────────────── */}
          {demoMode !== null && (
            <section
              className={
                demoMode
                  ? 'rounded-xl p-3.5 flex flex-col gap-4 bg-warning-surface border-[1.5px] border-warning-border'
                  : 'card p-3.5'
              }
              aria-labelledby="demo-heading"
            >
              <div className="flex items-center gap-2.5">
                <svg
                  aria-hidden="true"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.9"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`shrink-0 ${demoMode ? 'text-warning' : 'text-text-muted'}`}
                >
                  <path d="M12 9v4M12 17h.01M10.3 3.9 2.6 17.4A1.8 1.8 0 0 0 4.2 20h15.6a1.8 1.8 0 0 0 1.6-2.6L13.7 3.9a1.8 1.8 0 0 0-3.4 0z" />
                </svg>
                <span className="flex-1 flex flex-col gap-0.5">
                  <span
                    id="demo-heading"
                    className={`text-body-sm font-bold ${demoMode ? 'text-warning' : ''}`}
                  >
                    Mode démo {demoMode ? 'actif' : ''}
                  </span>
                  <span className={`text-caption ${demoMode ? 'text-warning' : 'text-text-muted'}`}>
                    {demoMode ? 'Données statiques · horaires et CO₂ fictifs' : 'APIs réelles'}
                  </span>
                </span>
                {/* input réel + span visuel (pas un <button>) : la règle globale
                 * `button{min-height:48px}` écraserait la pastille 46×28px. */}
                <input
                  type="checkbox"
                  role="switch"
                  aria-checked={demoMode}
                  aria-label="Activer ou désactiver le mode démo"
                  checked={demoMode}
                  disabled={demoLoading}
                  onChange={() => void toggle(!demoMode)}
                  className="sr-only peer"
                />
                <span
                  aria-hidden="true"
                  className={[
                    'shrink-0 w-[46px] h-7 rounded-full flex items-center p-[3px] transition-colors duration-fast',
                    'peer-disabled:opacity-50 peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-primary peer-focus-visible:ring-offset-2',
                    demoMode ? 'bg-warning justify-end' : 'bg-border justify-start',
                  ].join(' ')}
                >
                  <span className="w-[22px] h-[22px] rounded-full bg-surface" />
                </span>
              </div>

              {demoMode && (
                <div className="flex flex-col gap-4 pt-3 border-t border-warning-border">
                  <div>
                    <p className="text-body-sm font-semibold mb-2">Météo simulée</p>
                    <div className="flex gap-2" role="group" aria-label="Choisir la météo simulée">
                      <button
                        type="button"
                        onClick={() => void setWeather('sunny')}
                        disabled={demoLoading}
                        aria-pressed={weather === 'sunny'}
                        className={[
                          'flex-1 h-10 rounded-md text-body-sm font-semibold border transition-colors duration-fast',
                          weather === 'sunny'
                            ? 'bg-surface border-warning-border text-warning'
                            : 'bg-surface border-border text-text-muted',
                        ].join(' ')}
                      >
                        Soleil
                      </button>
                      <button
                        type="button"
                        onClick={() => void setWeather('rainy')}
                        disabled={demoLoading}
                        aria-pressed={weather === 'rainy'}
                        className={[
                          'flex-1 h-10 rounded-md text-body-sm font-semibold border transition-colors duration-fast',
                          weather === 'rainy'
                            ? 'bg-surface border-transit text-transit'
                            : 'bg-surface border-border text-text-muted',
                        ].join(' ')}
                      >
                        Pluie
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="flex-1 flex flex-col gap-0.5">
                      <span className="text-body-sm font-semibold">Simuler les trajets</span>
                      <span className="text-caption text-warning">
                        {providersDemo
                          ? 'Fichiers JSON — aucun appel externe'
                          : 'Transitous, OSRM et Bicloo en direct'}
                      </span>
                    </span>
                    <input
                      type="checkbox"
                      role="switch"
                      aria-checked={providersDemo ?? false}
                      aria-label="Activer ou désactiver la simulation des trajets"
                      checked={providersDemo ?? false}
                      disabled={demoLoading}
                      onChange={() => void toggleProviders(!providersDemo)}
                      className="sr-only peer"
                    />
                    <span
                      aria-hidden="true"
                      className={[
                        'shrink-0 w-[46px] h-7 rounded-full flex items-center p-[3px] transition-colors duration-fast',
                        'peer-disabled:opacity-50 peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-primary peer-focus-visible:ring-offset-2',
                        providersDemo ? 'bg-warning justify-end' : 'bg-border justify-start',
                      ].join(' ')}
                    >
                      <span className="w-[22px] h-[22px] rounded-full bg-surface" />
                    </span>
                  </div>

                  {providersDemo && (
                    <div>
                      <p className="text-body-sm font-semibold mb-2">Lancer un scénario</p>
                      <div className="flex flex-col gap-2">
                        {DEMO_SCENARIOS.map((scenario) => (
                          <button
                            key={scenario.toLabel}
                            type="button"
                            disabled={demoLoading}
                            onClick={() => {
                              void setWeather(scenario.weather).then(() => {
                                navigate('/', {
                                  state: {
                                    demoScenario: {
                                      from: scenario.from,
                                      to: scenario.to,
                                      fromLabel: scenario.fromLabel,
                                      toLabel: scenario.toLabel,
                                    },
                                  },
                                })
                              })
                            }}
                            className="flex items-center justify-between gap-3 px-3.5 py-3 rounded-md bg-surface border border-border text-left disabled:opacity-50"
                          >
                            <span className="min-w-0">
                              <span className="block text-body-sm font-semibold truncate">
                                {scenario.fromLabel} <span className="text-text-muted">→</span>{' '}
                                {scenario.toLabel}
                              </span>
                              <span className="block text-caption text-text-muted mt-0.5">
                                {scenario.description}
                              </span>
                            </span>
                            <svg
                              aria-hidden="true"
                              width="15"
                              height="15"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="shrink-0 text-text-muted"
                            >
                              <path d="M9 6l6 6-6 6" />
                            </svg>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </section>
          )}

          {/* ── Colonnes desktop : Application+Compte / Confidentialité+Zone
           * irréversible (MAQUETTE.md §5.6) — 1 seule colonne en mobile ──── */}
          <div className="flex flex-col gap-4 lg:grid lg:grid-cols-2 lg:gap-5 lg:items-start">
            <div className="flex flex-col gap-4">
              {/* ── Application ──────────────────────────────────────────────── */}
              <div className="flex flex-col gap-2">
                <span className="text-caption font-bold tracking-[0.06em] uppercase text-text-subtle">
                  Application
                </span>
                <div className="card overflow-hidden">
                  <SettingsRow
                    icon={
                      <>
                        <rect x="6" y="2.5" width="12" height="19" rx="2.5" />
                        <path d="M12 6v7M9 10l3 3 3-3" />
                      </>
                    }
                    title="Installer UrbanFlow"
                    subtitle="Accès hors-ligne · 1,2 Mo"
                    action={
                      canInstall ? (
                        <button
                          type="button"
                          onClick={() => void promptInstall()}
                          className="h-9 px-3.5 rounded-md border-[1.5px] border-primary text-primary text-caption font-semibold shrink-0"
                        >
                          Installer
                        </button>
                      ) : (
                        <span className="text-caption text-text-muted shrink-0">
                          Déjà installée
                        </span>
                      )
                    }
                  />
                  <SettingsRow
                    icon={
                      <>
                        <circle cx="12" cy="12" r="4.5" />
                        <path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M5 5l1.8 1.8M17.2 17.2 19 19M5 19l1.8-1.8M17.2 6.8 19 5" />
                      </>
                    }
                    title="Thème"
                    border={false}
                    action={
                      <span
                        ref={themeGroupRef}
                        role="radiogroup"
                        aria-label="Thème de l'application"
                        className="flex gap-1 p-[3px] bg-surface-sunken rounded-full shrink-0"
                        onKeyDown={(e) => {
                          if (!['ArrowLeft', 'ArrowRight'].includes(e.key)) return
                          e.preventDefault()
                          const currentIndex = THEME_OPTIONS.findIndex((opt) => opt.value === theme)
                          const delta = e.key === 'ArrowRight' ? 1 : -1
                          const nextIndex =
                            (currentIndex + delta + THEME_OPTIONS.length) % THEME_OPTIONS.length
                          setTheme(THEME_OPTIONS[nextIndex].value)
                          const buttons =
                            themeGroupRef.current?.querySelectorAll<HTMLButtonElement>(
                              '[role="radio"]'
                            )
                          buttons?.[nextIndex]?.focus()
                        }}
                      >
                        {THEME_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            role="radio"
                            aria-checked={theme === opt.value}
                            tabIndex={theme === opt.value ? 0 : -1}
                            onClick={() => setTheme(opt.value)}
                            className={[
                              'px-2.5 py-1.5 rounded-full text-caption transition-colors duration-fast',
                              theme === opt.value
                                ? 'bg-surface font-bold'
                                : 'font-semibold text-text-muted',
                            ].join(' ')}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </span>
                    }
                  />
                  {/* Langue — desktop uniquement (MAQUETTE.md §5.6) : affichage
                   * informatif, une seule langue supportée, pas de sélecteur (pas
                   * d'i18n dans le projet — rien à brancher derrière un chevron). */}
                  <div className="hidden lg:flex items-center gap-3 px-3.5 py-3 border-t border-surface-sunken">
                    <span className="flex-1 text-body-sm font-semibold">Langue</span>
                    <span className="text-caption text-text-muted">Français</span>
                  </div>
                </div>
              </div>

              <LogoutButton />
            </div>

            <div className="flex flex-col gap-4">
              {/* ── Confidentialité ──────────────────────────────────────────── */}
              <div className="flex flex-col gap-2">
                <span className="text-caption font-bold tracking-[0.06em] uppercase text-text-subtle">
                  Confidentialité
                </span>
                <div className="card overflow-hidden">
                  <SettingsRow
                    icon={
                      <>
                        <path d="M12 22s7-6.5 7-12A7 7 0 0 0 5 10c0 5.5 7 12 7 12z" />
                        <circle cx="12" cy="10" r="2.4" />
                      </>
                    }
                    title="Géolocalisation"
                    subtitle={geoGranted ? 'Autorisée trajet par trajet' : 'Désactivée'}
                    action={
                      geoGranted ? (
                        <button
                          type="button"
                          onClick={handleRevokeGeo}
                          className="text-caption font-semibold text-danger-text shrink-0"
                        >
                          Révoquer
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleActivateGeo}
                          className="text-caption font-semibold text-primary shrink-0"
                        >
                          Activer
                        </button>
                      )
                    }
                  />
                  <SettingsRow
                    icon={
                      <>
                        <circle cx="12" cy="12" r="9" />
                        <path d="M12 7v5l3.5 2" />
                      </>
                    }
                    title="Conservation des données"
                    subtitle="Trajets et historique supprimés après 12 mois"
                    action={null}
                  />
                  <SettingsRow
                    icon={
                      <>
                        <path d="M12 15V3m0 12-4-4m4 4 4-4" />
                        <path d="M3 15v4a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-4" />
                      </>
                    }
                    title="Exporter mes données"
                    subtitle="Téléchargement JSON — droit à la portabilité"
                    action={
                      <button
                        type="button"
                        onClick={() => void handleExport()}
                        disabled={isExporting}
                        className="text-caption font-semibold text-primary shrink-0 disabled:opacity-50"
                      >
                        {isExporting ? 'Export…' : 'Télécharger'}
                      </button>
                    }
                    border={false}
                  />
                </div>
                {exportError && (
                  <p role="alert" className="text-caption text-danger-text">
                    {exportError}
                  </p>
                )}
              </div>

              {/* ── Vos droits RGPD ──────────────────────────────────────────── */}
              <section className="card p-3.5" aria-labelledby="rights-heading">
                <h2 id="rights-heading" className="text-body-sm font-bold mb-1">
                  Vos droits (RGPD)
                </h2>
                <ul className="flex flex-col gap-1.5 mt-2">
                  <li className="flex gap-2 text-caption text-text-muted">
                    <span aria-hidden="true" className="text-primary shrink-0">
                      ✓
                    </span>
                    <span>
                      <b className="text-text">Droit d'accès</b> — vos données sont visibles dans
                      votre profil
                    </span>
                  </li>
                  <li className="flex gap-2 text-caption text-text-muted">
                    <span aria-hidden="true" className="text-primary shrink-0">
                      ✓
                    </span>
                    <span>
                      <b className="text-text">Droit à l'effacement</b> — suppression du compte à
                      tout moment ci-dessous
                    </span>
                  </li>
                  <li className="flex gap-2 text-caption text-text-muted">
                    <span aria-hidden="true" className="text-primary shrink-0">
                      ✓
                    </span>
                    <span>
                      <b className="text-text">Données GPS</b> — jamais transmises à des tiers ni
                      stockées au-delà de la session
                    </span>
                  </li>
                </ul>
              </section>

              {/* ── Zone irréversible ────────────────────────────────────────── */}
              <div className="rounded-xl p-3.5 flex flex-col gap-2.5 bg-danger-surface border-[1.5px] border-danger">
                <span className="flex flex-col gap-1">
                  <span className="text-body-sm font-bold text-danger-text">
                    Supprimer mon compte
                  </span>
                  <span className="text-caption text-danger-text-muted leading-relaxed">
                    Compte, trajets, points et récompenses effacés définitivement. Action
                    irréversible.
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(true)}
                  className="h-11 px-5 justify-center rounded-md border-[1.5px] border-danger bg-surface text-danger text-body-sm font-bold"
                >
                  Supprimer mon compte
                </button>
              </div>
            </div>
          </div>
        </main>

        {showDeleteModal && <DeleteAccountModal onClose={() => setShowDeleteModal(false)} />}
      </div>
    </PageWithSidebar>
  )
}
