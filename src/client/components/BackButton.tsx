import { Link } from 'react-router-dom'

function ChevronLeftIcon() {
  return (
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
  )
}

interface BackButtonProps {
  'aria-label': string
  /** Navigue vers une route fixe (`Link`). Omettre pour un retour d'historique (`onClick`). */
  to?: string
  onClick?: () => void
  className?: string
}

/** Chevron retour — `.btn-icon`, partagé entre les en-têtes de sous-pages et l'onboarding. */
export function BackButton({
  'aria-label': ariaLabel,
  to,
  onClick,
  className = '',
}: BackButtonProps) {
  const cls = `btn-icon ${className}`.trim()

  if (to) {
    return (
      <Link to={to} aria-label={ariaLabel} className={cls}>
        <ChevronLeftIcon />
      </Link>
    )
  }

  return (
    <button type="button" aria-label={ariaLabel} onClick={onClick} className={cls}>
      <ChevronLeftIcon />
    </button>
  )
}
