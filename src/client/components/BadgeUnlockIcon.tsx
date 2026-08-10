interface BadgeUnlockIconProps {
  size?: number
  className?: string
}

/** Icône badge/médaille du set Estuaire — remplace l'emoji 🏅 (interdit comme
 * icône fonctionnelle, SKILL.md § Interdictions formelles). Partagée par
 * `JourneySummaryModal` et `TripToast`, mêmes annonces "badge(s) débloqué(s)". */
export function BadgeUnlockIcon({ size = 14, className }: BadgeUnlockIconProps) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="8" r="6" />
      <path d="M8.5 13.2L7 22l5-3 5 3-1.5-8.8" />
    </svg>
  )
}
