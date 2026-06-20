import { NavLink } from 'react-router-dom'

// Trajets → /trajets is a future page; catch-all redirects to / for now
const NAV_ITEMS = [
  {
    label: 'Carte',
    to: '/',
    end: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" aria-hidden="true">
        <path d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
      </svg>
    ),
  },
  {
    label: 'Trajets',
    to: '/trajets',
    end: false,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" aria-hidden="true">
        <circle cx="5" cy="18" r="2" />
        <circle cx="19" cy="6" r="2" />
        <path d="M5 16V10a4 4 0 014-4h6" />
        <path d="M16 4l3 2-3 2" />
      </svg>
    ),
  },
  {
    label: 'Stats',
    to: '/dashboard',
    end: false,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" aria-hidden="true">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
  {
    label: 'Profil',
    to: '/profile',
    end: false,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" aria-hidden="true">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
] as const

export function BottomNav() {
  return (
    <nav
      className="shrink-0 bg-bg-elevated border-t border-border z-navbar"
      aria-label="Navigation principale"
    >
      <ul className="flex h-[4.5rem]">
        {NAV_ITEMS.map(({ label, to, end, icon }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                [
                  'h-full flex flex-col items-center justify-center gap-1 px-2',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent-eco',
                  isActive ? 'text-accent-eco' : 'text-text-disabled',
                ].join(' ')
              }
            >
              {({ isActive }) => (
                <>
                  {icon}
                  <span
                    className={`text-[10px] font-medium leading-none transition-colors duration-fast ${
                      isActive ? 'text-text-primary' : 'text-text-disabled'
                    }`}
                  >
                    {label}
                  </span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
