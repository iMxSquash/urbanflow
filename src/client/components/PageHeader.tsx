import type { ReactNode } from 'react'

interface PageHeaderProps {
  children: ReactNode
  className?: string
}

/** Coquille d'en-tête sticky partagée par les pages avec sous-navigation
 * (DashboardBadgesPage, ParametresPage, ProfilePage, RewardsPage). */
export function PageHeader({ children, className = '' }: PageHeaderProps) {
  return (
    <header
      className={`bg-surface border-b border-border sticky top-0 z-navbar ${className}`.trim()}
    >
      {children}
    </header>
  )
}
