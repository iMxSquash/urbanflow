import type { CSSProperties } from 'react'
import type { TransportMode } from '@shared/types/index'

const MODE_LABEL: Record<TransportMode, string> = {
  walk: 'Marche',
  bike: 'Vélo',
  scooter: 'Trottinette',
  tramway: 'Tram',
  bus: 'Bus',
  navibus: 'Navibus',
  train: 'Train',
}

// Icônes du set Estuaire (viewBox 0 0 24 24, stroke-width 1.9) — walk/bike/tram/bus/navibus
// uniquement : scooter et train n'ont pas d'icône dédiée dans les maquettes (chip texte seul).
const MODE_ICON_PATH: Partial<Record<TransportMode, React.ReactNode>> = {
  walk: (
    <>
      <circle cx="12" cy="4" r="2" />
      <path d="M12 6v5l-3 3 1 5M12 11l3 3v5" />
    </>
  ),
  bike: (
    <>
      <circle cx="6" cy="17" r="3" />
      <circle cx="18" cy="17" r="3" />
      <path d="M9 17h5l-2-7 3-2M13 8h3" />
    </>
  ),
  tramway: (
    <>
      <rect x="5" y="3" width="14" height="14" rx="3" />
      <path d="M5 11h14M8 21l2-4M16 21l-2-4M3 21h18" />
    </>
  ),
  bus: (
    <>
      <rect x="4" y="4" width="16" height="13" rx="2" />
      <path d="M4 12h16M7.5 20v-3M16.5 20v-3" />
    </>
  ),
  navibus: (
    <path d="M3.5 16l1.5-5h14l1.5 5M6.5 11V7h11v4M3.5 20c1.4 0 2.4-1 3.8-1s2.4 1 3.8 1 2.4-1 3.8-1 2.4 1 3.8 1" />
  ),
}

interface ModeChipProps {
  mode: TransportMode
  selected?: boolean
  size?: 'sm' | 'md'
  onClick?: () => void
}

/** Chip de mode de transport — `.chip-mode`, couleur + surface dédiées par mode (Estuaire). */
export function ModeChip({ mode, selected = false, size = 'md', onClick }: ModeChipProps) {
  const icon = MODE_ICON_PATH[mode]
  const tokenName = mode === 'tramway' ? 'tram' : mode
  // --mode-color / --mode-surface sont consommées par .chip-mode dans index.css
  const style = {
    '--mode-color': `var(--color-mode-${tokenName})`,
    '--mode-surface': `var(--color-mode-${tokenName}-surface)`,
  } as CSSProperties

  const content = (
    <>
      {icon && (
        <svg
          aria-hidden="true"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {icon}
        </svg>
      )}
      {MODE_LABEL[mode]}
    </>
  )

  if (onClick) {
    return (
      <button
        type="button"
        className="chip-mode"
        data-size={size === 'sm' ? 'sm' : undefined}
        data-selected={selected ? 'true' : undefined}
        style={style}
        aria-pressed={selected}
        onClick={onClick}
      >
        {content}
      </button>
    )
  }

  return (
    <span
      className="chip-mode"
      data-size={size === 'sm' ? 'sm' : undefined}
      data-selected={selected ? 'true' : undefined}
      style={style}
    >
      {content}
    </span>
  )
}
