import type { CSSProperties } from 'react'
import type { TransportMode } from '@shared/types/index'
import { MODE_ICON_PATH_BASE } from '../constants/mode-icons'

const MODE_LABEL: Record<TransportMode, string> = {
  walk: 'Marche',
  bike: 'Vélo',
  scooter: 'Trottinette',
  tramway: 'Tram',
  bus: 'Bus',
  navibus: 'Navibus',
  train: 'Train',
}

interface ModeChipProps {
  mode: TransportMode
  selected?: boolean
  size?: 'sm' | 'md'
  onClick?: () => void
}

/** Chip de mode de transport — `.chip-mode`, couleur + surface dédiées par mode (Estuaire). */
export function ModeChip({ mode, selected = false, size = 'md', onClick }: ModeChipProps) {
  const icon = MODE_ICON_PATH_BASE[mode]
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
