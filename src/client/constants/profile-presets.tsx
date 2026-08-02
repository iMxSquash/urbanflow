import type { ReactNode } from 'react'
import type { UserPreference } from '@shared/types/index'

export interface ProfilePreset {
  value: UserPreference
  label: string
  description: string
  icon: ReactNode
}

/** Icônes du set Estuaire (viewBox 0 0 24 24) — mêmes tracés que les maquettes. */
export const PROFILE_PRESETS: ProfilePreset[] = [
  {
    value: 'eco',
    label: 'Éco',
    description: 'Le moins d’émissions, quitte à prendre un peu plus de temps',
    icon: <path d="M17 8C8 10 5.9 16.17 3.82 22c2 0 7.68-1 13-6 2-2 3-5 3-8s-1-5-1-5L17 8z" />,
  },
  {
    value: 'fast',
    label: 'Rapide',
    description: 'Le trajet le plus court en temps',
    icon: <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />,
  },
  {
    value: 'balanced',
    label: 'Équilibré',
    description: 'Compromis entre temps et émissions',
    icon: <path d="M12 3v18M4 8h16M4 16h16" />,
  },
]
