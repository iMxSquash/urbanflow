import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode
  'aria-label': string
}

/** Bouton icône — `.btn-icon` (control-lg 44px, radius-md, surface + shadow-card). */
export function IconButton({ icon, className = '', ...props }: IconButtonProps) {
  return (
    <button type="button" className={`btn-icon ${className}`.trim()} {...props}>
      {icon}
    </button>
  )
}
