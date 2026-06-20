import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useConsentStore } from '../stores/consent.store'
import { useDemoStore } from '../stores/demo.store'
import { BottomNav } from '../components/BottomNav'
import type { Coordinates } from '@shared/types/index'

// ── Types locaux ─────────────────────────────────────────────────────────────

interface DemoScenario {
  fromLabel: string
  toLabel: string
  from: Coordinates
  to: Coordinates
  weather: 'sunny' | 'rainy'
  description: string
}

// ── Config ───────────────────────────────────────────────────────────────────

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

// ── Sous-composants ───────────────────────────────────────────────────────────

function Toggle({
  checked,
  onChange,
  label,
  disabled = false,
  accent = 'eco',
}: {
  checked: boolean
  onChange: () => void
  label: string
  disabled?: boolean
  accent?: 'eco' | 'warning'
}) {
  const trackActive = accent === 'warning' ? 'bg-accent-warning' : 'bg-accent-eco'
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      disabled={disabled}
      className={[
        'relative shrink-0 w-12 h-7 rounded-full transition-colors duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-eco',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        checked ? trackActive : 'bg-border-strong',
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

function ConsentBadge({ granted }: { granted: boolean }) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-caption font-medium',
        granted ? 'bg-bg-elevated text-accent-eco' : 'bg-bg-elevated text-text-disabled',
      ].join(' ')}
    >
      <span
        aria-hidden="true"
        className={[
          'w-1.5 h-1.5 rounded-full',
          granted ? 'bg-accent-eco' : 'bg-text-disabled',
        ].join(' ')}
      />
      {granted ? 'Activée' : 'Désactivée'}
    </span>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

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
        <h1 className="text-h2 font-bold text-text-primary">Paramètres</h1>
      </header>

      {/* ── Contenu scrollable ─────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 pb-8 space-y-6">

          {/* ── Mode démo ─────────────────────────────────────────────────── */}
          {demoMode !== null && (
            <section aria-labelledby="demo-heading">
              <h2
                id="demo-heading"
                className="text-h3 font-semibold text-accent-eco mb-3 px-1"
              >
                Mode démo
              </h2>

              <div
                className={[
                  'bg-bg-card rounded-card overflow-hidden',
                  demoMode ? 'border border-accent-warning' : 'border border-border',
                ].join(' ')}
              >
                {/* Toggle principal */}
                <div className="flex items-center justify-between gap-4 px-4 py-4">
                  <div className="min-w-0">
                    <p className="text-body font-semibold text-text-primary">Activer le mode démo</p>
                    <p className={['text-body-sm mt-0.5', demoMode ? 'text-accent-warning' : 'text-text-muted'].join(' ')}>
                      {demoMode ? 'Météo simulée — trajets réels' : 'APIs réelles'}
                    </p>
                  </div>
                  <Toggle
                    checked={demoMode}
                    onChange={() => void toggle(!demoMode)}
                    label="Activer ou désactiver le mode démo"
                    disabled={demoLoading}
                    accent="warning"
                  />
                </div>

                {/* Détails démo */}
                {demoMode && (
                  <div className="border-t border-border px-4 py-4 space-y-5">
                    {/* Météo simulée */}
                    <div>
                      <p className="text-body-sm font-medium text-text-secondary mb-2">
                        Météo simulée
                      </p>
                      <div
                        className="flex gap-2"
                        role="group"
                        aria-label="Choisir la météo simulée"
                      >
                        {(['sunny', 'rainy'] as const).map((w) => (
                          <button
                            key={w}
                            type="button"
                            onClick={() => void setWeather(w)}
                            disabled={demoLoading}
                            aria-pressed={weather === w}
                            className={[
                              'flex items-center gap-2 px-4 py-2 rounded-xl text-body-sm font-medium transition-colors duration-fast border disabled:opacity-50',
                              weather === w
                                ? 'bg-bg-elevated border-accent-eco text-text-primary'
                                : 'bg-bg-base border-border text-text-muted hover:border-accent-eco/50',
                            ].join(' ')}
                          >
                            <span aria-hidden="true">{w === 'sunny' ? '☀️' : '🌧️'}</span>
                            {w === 'sunny' ? 'Soleil' : 'Pluie'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Simuler les providers */}
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-body-sm font-medium text-text-primary">
                          Simuler les trajets
                        </p>
                        <p className="text-caption text-text-muted mt-0.5">
                          {providersDemo
                            ? 'Fichiers JSON — aucun appel Transitous / OSRM / Bicloo'
                            : 'Transitous, OSRM et Bicloo en direct'}
                        </p>
                      </div>
                      <Toggle
                        checked={providersDemo ?? false}
                        onChange={() => void toggleProviders(!providersDemo)}
                        label="Activer ou désactiver la simulation des trajets"
                        disabled={demoLoading}
                        accent="warning"
                      />
                    </div>

                    {/* Scénarios */}
                    {providersDemo && (
                      <div>
                        <p className="text-body-sm font-medium text-text-secondary mb-2">
                          Lancer un scénario
                        </p>
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
                              className="flex items-center justify-between gap-3 px-4 py-3 rounded-card bg-bg-base border border-border text-left hover:border-accent-eco transition-colors duration-fast group disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-eco"
                            >
                              <div className="min-w-0">
                                <p className="text-body-sm font-medium text-text-primary truncate">
                                  {scenario.fromLabel}
                                  <span
                                    className="text-text-disabled mx-1"
                                    aria-hidden="true"
                                  >
                                    →
                                  </span>
                                  {scenario.toLabel}
                                </p>
                                <p className="text-caption text-text-muted mt-0.5">
                                  {scenario.description}
                                </p>
                              </div>
                              <svg
                                aria-hidden="true"
                                width="16"
                                height="16"
                                viewBox="0 0 16 16"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="shrink-0 text-text-disabled group-hover:text-accent-eco transition-colors duration-fast"
                              >
                                <path d="M3 8h10M8 3l5 5-5 5" />
                              </svg>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </section>
          )}

          {/* ── Confidentialité ───────────────────────────────────────────── */}
          <section aria-labelledby="privacy-heading">
            <h2
              id="privacy-heading"
              className="text-h3 font-semibold text-accent-eco mb-3 px-1"
            >
              Confidentialité & données
            </h2>

            <div className="bg-bg-card rounded-card overflow-hidden divide-y divide-border">
              {/* Géolocalisation */}
              <div className="flex items-center justify-between gap-4 px-4 py-4">
                <div className="min-w-0">
                  <p className="text-body-sm font-semibold text-text-primary">Géolocalisation</p>
                  <p className="text-caption text-text-muted mt-0.5">
                    Affiche votre position en temps réel sur la carte
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <ConsentBadge granted={geoGranted} />
                  {geoGranted ? (
                    <button
                      type="button"
                      onClick={handleRevokeGeo}
                      className="text-caption font-medium text-accent-error hover:opacity-80 transition-opacity duration-fast px-3 py-1.5 rounded-lg border border-accent-error/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-error"
                    >
                      Révoquer
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleActivateGeo}
                      className="text-caption font-medium text-accent-eco hover:opacity-80 transition-opacity duration-fast px-3 py-1.5 rounded-lg border border-accent-eco/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-eco"
                    >
                      Activer
                    </button>
                  )}
                </div>
              </div>

              {/* Note si non accordé */}
              {!geoGranted && (
                <div className="px-4 py-3 bg-bg-base">
                  <p className="text-caption text-text-muted">
                    En activant la géolocalisation vous serez redirigé vers la carte où une modale
                    de consentement vous sera présentée.
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* ── Vos droits RGPD ───────────────────────────────────────────── */}
          <section aria-labelledby="rights-heading">
            <h2
              id="rights-heading"
              className="text-h3 font-semibold text-accent-eco mb-3 px-1"
            >
              Vos droits (RGPD)
            </h2>

            <div className="bg-bg-card rounded-card px-4 py-4">
              <ul className="space-y-3 text-body-sm text-text-secondary">
                {[
                  {
                    title: "Droit d'accès",
                    desc: 'vos données de profil et de mobilité sont visibles dans votre profil',
                  },
                  {
                    title: "Droit à l'effacement",
                    desc: 'vous pouvez supprimer votre compte et toutes vos données à tout moment',
                  },
                  {
                    title: 'Données GPS',
                    desc: "aucune donnée de position n'est transmise à des tiers ni stockée au-delà de la session",
                  },
                  {
                    title: 'Conservation',
                    desc: 'les données de trajets sont conservées 12 mois maximum',
                  },
                ].map(({ title, desc }) => (
                  <li key={title} className="flex gap-2">
                    <span aria-hidden="true" className="text-accent-eco shrink-0 mt-0.5">
                      ✓
                    </span>
                    <span>
                      <strong className="font-semibold text-text-primary">{title}</strong>
                      {' — '}
                      {desc}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* ── Supprimer mon compte ──────────────────────────────────────── */}
          <section aria-labelledby="delete-heading">
            <h2
              id="delete-heading"
              className="text-h3 font-semibold text-accent-eco mb-3 px-1"
            >
              Supprimer mon compte
            </h2>

            <div className="bg-bg-card rounded-card border border-accent-error/20 px-4 py-4">
              <p className="text-body-sm text-text-muted mb-4">
                Suppression définitive de votre compte et de toutes vos données (droit à
                l'effacement RGPD).
              </p>
              <Link
                to="/profile"
                className="inline-flex items-center gap-2 text-body-sm font-medium text-accent-error border border-accent-error/30 rounded-xl px-4 py-2 hover:bg-accent-error/5 transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-error"
              >
                Accéder à la gestion du compte
                <svg
                  aria-hidden="true"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </section>

        </div>
      </main>

      {/* ── Bottom Navigation ─────────────────────────────────────────────── */}
      <BottomNav />
    </div>
  )
}
