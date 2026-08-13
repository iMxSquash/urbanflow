import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

interface GuestLockedProps {
  /** true si le contenu doit être verrouillé (typiquement `isGuest` du auth store). */
  active: boolean
  title?: string
  description?: string
  className?: string
  children: ReactNode
}

/**
 * Verrouille visuellement une section pour les utilisateurs invités : le
 * contenu passé en `children` (données réelles ou fictives à la charge de
 * l'appelant) reste affiché mais flouté et neutralisé (`inert` — retire
 * pointeur, focus clavier et lecteur d'écran d'un coup), une carte d'invite
 * au compte est superposée. Remplace un blocage d'URL/redirection : la page
 * reste atteignable, seule la donnée est masquée.
 */
export function GuestLocked({ active, title, description, className, children }: GuestLockedProps) {
  return (
    <div className={['relative', className].filter(Boolean).join(' ')}>
      <div
        className={['flex-1 flex flex-col', active && 'blur-[5px] select-none']
          .filter(Boolean)
          .join(' ')}
        inert={active || undefined}
      >
        {children}
      </div>
      {active && <GuestLockOverlay title={title} description={description} />}
    </div>
  )
}

function LockIcon() {
  return (
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
    >
      <rect x="4.5" y="10.5" width="15" height="10" rx="2" />
      <path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" />
    </svg>
  )
}

interface GuestLockOverlayProps {
  title?: string
  description?: string
}

/** Carte d'invite « se connecter / créer un compte » — utiliser via `GuestLocked`. */
export function GuestLockOverlay({
  title = 'Créez un compte pour continuer',
  description = 'Connectez-vous ou créez un compte gratuitement pour accéder à cette section.',
}: GuestLockOverlayProps) {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-bg/75 backdrop-blur-sm">
      <div className="w-full max-w-xs flex flex-col items-center gap-3 p-6 text-center card">
        <span
          aria-hidden="true"
          className="size-11 rounded-full bg-primary-surface text-primary flex items-center justify-center"
        >
          <LockIcon />
        </span>
        <div>
          <h2 className="text-body font-bold">{title}</h2>
          <p className="text-body-sm text-text-muted mt-1">{description}</p>
        </div>
        <div className="flex flex-col gap-2 w-full mt-1">
          <Link to="/register" className="btn-primary w-full no-underline">
            Créer un compte
          </Link>
          <Link to="/login" className="btn-secondary w-full no-underline">
            Se connecter
          </Link>
        </div>
      </div>
    </div>
  )
}
