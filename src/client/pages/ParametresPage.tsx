import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useConsentStore } from '../stores/consent.store'
import { useDemoStore } from '../stores/demo.store'

function ConsentBadge({ granted }: { granted: boolean }) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-caption font-medium',
        granted ? 'bg-eco-50 text-eco-700' : 'bg-slate-100 text-slate-500',
      ].join(' ')}
    >
      <span
        aria-hidden="true"
        className={['w-1.5 h-1.5 rounded-full', granted ? 'bg-eco-500' : 'bg-slate-400'].join(' ')}
      />
      {granted ? 'Activée' : 'Désactivée'}
    </span>
  )
}

export default function ParametresPage() {
  const { geolocationConsent, denyGeolocation, resetGeolocation } = useConsentStore()
  const navigate = useNavigate()
  const { demoMode, loading: demoLoading, fetch: fetchDemo, toggle } = useDemoStore()

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
    <div className="min-h-screen bg-slate-50">
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
          <h1 className="text-h2 font-bold text-slate-900">Paramètres</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 lg:px-6 space-y-6">
        {/* ── Mode démo ────────────────────────────────────────────────── */}
        {demoMode !== null && (
          <section
            className={[
              'card p-4 lg:p-6 border',
              demoMode ? 'border-amber-200 bg-amber-50' : 'border-slate-200',
            ].join(' ')}
            aria-labelledby="demo-heading"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 id="demo-heading" className="text-h3 font-semibold text-slate-900">
                  Mode démo
                </h2>
                <p className="text-body-sm text-slate-500 mt-0.5">
                  {demoMode
                    ? 'Données simulées — aucun appel réseau externe'
                    : 'APIs réelles (Transitous, OpenWeather, Bicloo)'}
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={demoMode}
                aria-label="Activer ou désactiver le mode démo"
                disabled={demoLoading}
                onClick={() => void toggle(!demoMode)}
                className={[
                  'relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-eco-500 disabled:opacity-50',
                  demoMode ? 'bg-amber-400' : 'bg-slate-300',
                ].join(' ')}
              >
                <span
                  aria-hidden="true"
                  className={[
                    'pointer-events-none inline-block h-6 w-6 rounded-full bg-white shadow-sm ring-0 transition-transform duration-200',
                    demoMode ? 'translate-x-5' : 'translate-x-0',
                  ].join(' ')}
                />
              </button>
            </div>
          </section>
        )}

        {/* ── Confidentialité ───────────────────────────────────────────── */}
        <section className="card p-4 lg:p-6" aria-labelledby="privacy-heading">
          <h2 id="privacy-heading" className="text-h3 font-semibold text-slate-900">
            Confidentialité & données
          </h2>
          <p className="text-body-sm text-slate-500 mt-0.5 mb-5">
            Gérez vos consentements conformément au RGPD
          </p>

          <div className="divide-y divide-slate-100">
            {/* Géolocalisation */}
            <div className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
              <div className="min-w-0">
                <p className="text-body-sm font-medium text-slate-900">Géolocalisation</p>
                <p className="text-caption text-slate-500 mt-0.5">
                  Affiche votre position en temps réel sur la carte
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <ConsentBadge granted={geoGranted} />
                {geoGranted ? (
                  <button
                    type="button"
                    onClick={handleRevokeGeo}
                    className="btn-ghost text-caption px-3 text-red-600 hover:bg-red-50"
                    style={{ minHeight: '36px' }}
                  >
                    Révoquer
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleActivateGeo}
                    className="btn-secondary text-caption px-3"
                    style={{ minHeight: '36px' }}
                  >
                    Activer
                  </button>
                )}
              </div>
            </div>
          </div>

          {!geoGranted && (
            <p className="mt-4 text-caption text-slate-400 bg-slate-50 rounded-card px-3 py-2">
              En activant la géolocalisation vous serez redirigé vers la carte où une modale de
              consentement vous sera présentée.
            </p>
          )}
        </section>

        {/* ── Vos droits RGPD ───────────────────────────────────────────── */}
        <section className="card p-4 lg:p-6" aria-labelledby="rights-heading">
          <h2 id="rights-heading" className="text-h3 font-semibold text-slate-900">
            Vos droits
          </h2>
          <p className="text-body-sm text-slate-500 mt-0.5 mb-4">
            Conformément au Règlement Général sur la Protection des Données (RGPD)
          </p>

          <ul className="space-y-3 text-body-sm text-slate-600">
            <li className="flex gap-2">
              <span aria-hidden="true" className="text-eco-500 shrink-0">
                ✓
              </span>
              <span>
                <strong className="font-medium text-slate-800">Droit d'accès</strong> — vos données
                de profil et de mobilité sont visibles dans votre profil
              </span>
            </li>
            <li className="flex gap-2">
              <span aria-hidden="true" className="text-eco-500 shrink-0">
                ✓
              </span>
              <span>
                <strong className="font-medium text-slate-800">Droit à l'effacement</strong> — vous
                pouvez supprimer votre compte et toutes vos données à tout moment
              </span>
            </li>
            <li className="flex gap-2">
              <span aria-hidden="true" className="text-eco-500 shrink-0">
                ✓
              </span>
              <span>
                <strong className="font-medium text-slate-800">Données GPS</strong> — aucune donnée
                de position n'est transmise à des tiers ni stockée au-delà de la session
              </span>
            </li>
            <li className="flex gap-2">
              <span aria-hidden="true" className="text-eco-500 shrink-0">
                ✓
              </span>
              <span>
                <strong className="font-medium text-slate-800">Conservation</strong> — les données
                de trajets sont conservées 12 mois maximum
              </span>
            </li>
          </ul>
        </section>

        {/* ── Supprimer le compte ───────────────────────────────────────── */}
        <section className="card p-4 lg:p-6 border border-red-100" aria-labelledby="delete-heading">
          <h2 id="delete-heading" className="text-h3 font-semibold text-slate-900">
            Supprimer mon compte
          </h2>
          <p className="text-body-sm text-slate-500 mt-0.5 mb-4">
            Suppression définitive de votre compte et de toutes vos données (droit à l'effacement
            RGPD)
          </p>
          <Link
            to="/profile"
            className="btn-ghost text-caption px-4 text-red-600 hover:bg-red-50 border border-red-200"
            style={{ minHeight: '36px', display: 'inline-flex', alignItems: 'center' }}
          >
            Accéder à la gestion du compte
          </Link>
        </section>
      </main>
    </div>
  )
}
