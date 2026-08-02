import { NavLink } from 'react-router-dom'
import { useAuthStore } from '../stores/auth.store'

interface NavItem {
  to: string
  label: string
  icon: React.ReactNode
  desktopOnly?: boolean
}

const ITEMS: NavItem[] = [
  {
    to: '/',
    label: 'Carte',
    icon: (
      <>
        <path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2V6z" />
        <path d="M9 4v14M15 6v14" />
      </>
    ),
  },
  {
    to: '/dashboard',
    label: 'Progrès',
    icon: <path d="M6 20v-6M12 20V7M18 20v-9M3 20h18" />,
  },
  {
    to: '/rewards',
    label: 'Récompenses',
    icon: (
      <>
        <rect x="3" y="8" width="18" height="13" rx="1.5" />
        <path d="M3 8h18M12 8v13M7.5 8a2.5 2.5 0 0 1 0-5C9 3 12 5 12 8M16.5 8a2.5 2.5 0 0 0 0-5C15 3 12 5 12 8" />
      </>
    ),
  },
  {
    to: '/profile',
    label: 'Profil',
    icon: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4.5 21c0-3.6 3.4-5.5 7.5-5.5s7.5 1.9 7.5 5.5" />
      </>
    ),
  },
  {
    to: '/parametres',
    label: 'Paramètres',
    desktopOnly: true,
    icon: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </>
    ),
  },
]

/** Bloc identité — pied de la sidebar desktop uniquement (MAQUETTE.md §7). */
function UserFooter() {
  const user = useAuthStore((s) => s.user)
  const isGuest = useAuthStore((s) => s.isGuest)

  if (isGuest || !user) return null

  const initials = user.email.slice(0, 2).toUpperCase()

  return (
    <div className="hidden lg:flex items-center gap-2.5 px-2.5 py-3 mt-1.5 border-t border-surface-sunken">
      <span
        aria-hidden="true"
        className="size-9 rounded-full bg-primary-surface text-primary text-label font-bold flex items-center justify-center shrink-0"
      >
        {initials}
      </span>
      <span className="min-w-0 text-body-sm font-semibold text-text truncate">{user.email}</span>
    </div>
  )
}

/** Navigation principale — `.bottom-nav` (4 items mobiles, devient sidebar 232px ≥1024px). */
export function BottomNav() {
  return (
    <nav aria-label="Navigation principale" className="bottom-nav">
      {ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/'}
          className={['bottom-nav-item', item.desktopOnly ? 'max-lg:hidden lg:mt-auto' : ''].join(
            ' '
          )}
        >
          <svg
            aria-hidden="true"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {item.icon}
          </svg>
          {item.label}
        </NavLink>
      ))}
      <UserFooter />
    </nav>
  )
}
