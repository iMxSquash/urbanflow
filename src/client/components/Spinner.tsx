interface SpinnerProps {
  size?: 'sm' | 'md'
  className?: string
}

const SIZE_CLASSES: Record<NonNullable<SpinnerProps['size']>, string> = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
}

/** Indicateur de chargement inline — `.skeleton` (shimmer) façonné en cercle,
 * pas `animate-spin` (boucle décorative interdite, SKILL.md § Animations). Le
 * shimmer est la seule animation en boucle exemptée de `prefers-reduced-motion` :
 * c'est une information d'état de chargement, pas une décoration. */
export function Spinner({ size = 'sm', className = '' }: SpinnerProps) {
  return (
    <span
      aria-hidden="true"
      className={['skeleton', 'inline-block', 'rounded-full', SIZE_CLASSES[size], className]
        .filter(Boolean)
        .join(' ')}
    />
  )
}
