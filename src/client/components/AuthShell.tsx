import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import urbanflowIcon from '../assets/urbanflow-icon.svg'

interface AuthShellProps {
  active: 'login' | 'register'
  children: ReactNode
}

function tabClass(isActive: boolean): string {
  return [
    'flex-1 text-center h-11 rounded-full text-body-sm font-semibold no-underline transition-colors duration-fast',
    isActive ? 'bg-primary text-on-primary' : 'text-text hover:bg-surface',
  ].join(' ')
}

/** Écran unique Connexion/Inscription (MAQUETTE.md §5.1) — deux routes distinctes
 * stylées comme des onglets. `role="tab"`/`aria-selected` supposent un tablist
 * qui bascule un panneau sur la même page ; ici on navigue réellement entre
 * deux routes, donc on utilise `aria-current="page"` sur des liens plutôt que
 * la sémantique ARIA tabs, qui serait trompeuse pour un lecteur d'écran. */
export function AuthShell({ active, children }: AuthShellProps) {
  return (
    <main className="min-h-screen bg-bg flex items-center justify-center px-4 py-6 lg:py-12">
      <div className="w-full max-w-sm rounded-2xl overflow-hidden shadow-modal bg-surface flex flex-col">
        <div className="h-[196px] shrink-0 flex flex-col justify-end gap-2 p-6 bg-primary">
          <img src={urbanflowIcon} alt="" width={40} height={40} />
          <span className="text-h2 font-bold text-on-primary tracking-tight">UrbanFlow</span>
          <span className="text-body-sm text-on-primary-muted">
            Itinéraires multimodaux à Nantes Métropole
          </span>
        </div>

        <div className="flex-1 flex flex-col gap-4 p-5 -mt-6 rounded-t-2xl bg-surface">
          <nav aria-label="Connexion ou inscription" className="flex gap-1.5 p-1 bg-surface-sunken rounded-full">
            <Link to="/login" aria-current={active === 'login' ? 'page' : undefined} className={tabClass(active === 'login')}>
              Connexion
            </Link>
            <Link
              to="/register"
              aria-current={active === 'register' ? 'page' : undefined}
              className={tabClass(active === 'register')}
            >
              Inscription
            </Link>
          </nav>

          {children}
        </div>
      </div>
    </main>
  )
}

interface AuthFooterNoticeProps {
  onContinueAsGuest: () => void
}

/** Bandeau RGPD + sortie « sans compte » — partagé Connexion/Inscription. */
export function AuthFooterNotice({ onContinueAsGuest }: AuthFooterNoticeProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2.5 p-3 rounded-md bg-surface-sunken">
        <svg
          aria-hidden="true"
          width="17"
          height="17"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-text-muted shrink-0"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8h.01M11 12h1v4h1" />
        </svg>
        <span className="text-caption text-text-muted leading-snug">
          Aucune donnée de trajet n'est enregistrée avant votre accord.{' '}
          <Link to="/parametres" className="underline underline-offset-2">
            Politique de confidentialité
          </Link>
        </span>
      </div>

      <button type="button" onClick={onContinueAsGuest} className="btn-secondary w-full">
        Continuer sans compte
      </button>
    </div>
  )
}
