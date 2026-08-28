import { useEffect } from 'react'
import { GRAMS_PER_POINT } from '@shared/constants/gamification'
import { BadgeUnlockIcon } from './BadgeUnlockIcon'

interface TripToastProps {
  co2SavedGrams: number
  pointsEarned: number
  totalPoints: number
  newlyUnlockedBadges?: string[]
  onClose: () => void
}

function formatCo2(grams: number): string {
  return grams >= 1000 ? `${(grams / 1000).toFixed(1)} kg` : `${grams} g`
}

export function TripToast({
  co2SavedGrams,
  pointsEarned,
  totalPoints,
  newlyUnlockedBadges = [],
  onClose,
}: TripToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000)
    return () => clearTimeout(timer)
  }, [onClose])

  // Points qu'un suivi GPS actif aurait rapportés — rend le manque à gagner
  // concret plutôt qu'un message générique (cf. gamification.service.ts côté
  // serveur, même formule que computePoints)
  const potentialPoints = Math.floor(co2SavedGrams / GRAMS_PER_POINT)

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={
        pointsEarned > 0
          ? `Trajet enregistré. +${pointsEarned} points. ${formatCo2(co2SavedGrams)} de CO₂ économisés.`
          : potentialPoints > 0
            ? `Trajet enregistré sans suivi GPS. ${formatCo2(co2SavedGrams)} de CO₂ économisés. ${potentialPoints} points manqués — activez le suivi GPS pour les gagner.`
            : `Trajet enregistré sans suivi GPS. ${formatCo2(co2SavedGrams)} de CO₂ économisés. Activez le suivi GPS pour gagner des points.`
      }
      className="toast animate-slide-up"
    >
      <div
        aria-hidden="true"
        className="shrink-0 w-9 h-9 rounded-full bg-primary-surface flex items-center justify-center"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-primary"
        >
          <path d="M17 8C8 10 5.9 16.17 3.82 22c2 0 7.68-1 13-6 2-2 3-5 3-8s-1-5-1-5l-1.82 5z" />
        </svg>
      </div>

      <div className="min-w-0 flex-1">
        {pointsEarned > 0 ? (
          <>
            <p className="text-body-sm font-bold text-text leading-snug">
              Bon trajet !{' '}
              <span className="text-primary">
                +{pointsEarned} pt{pointsEarned > 1 ? 's' : ''}
              </span>
            </p>
            <p className="text-caption text-primary mt-0.5">
              {formatCo2(co2SavedGrams)} CO₂ économisés vs voiture
            </p>
            <p className="text-caption text-text-subtle mt-0.5">
              Total cumulé : <span className="font-medium text-text-muted">{totalPoints} pts</span>
            </p>
            {newlyUnlockedBadges.length > 0 && (
              <p className="flex items-center gap-1.5 text-caption text-warning font-medium mt-1">
                <BadgeUnlockIcon size={12} />
                {newlyUnlockedBadges.length === 1
                  ? '1 badge débloqué !'
                  : `${newlyUnlockedBadges.length} badges débloqués !`}
              </p>
            )}
          </>
        ) : (
          <>
            <p className="text-body-sm font-bold text-text leading-snug">Trajet enregistré</p>
            <p className="text-caption text-primary mt-0.5">
              {formatCo2(co2SavedGrams)} CO₂ économisés vs voiture
            </p>
            <p className="text-caption text-text-subtle mt-0.5">
              {potentialPoints > 0
                ? `${potentialPoints} point${potentialPoints > 1 ? 's' : ''} manqué${potentialPoints > 1 ? 's' : ''} — activez le suivi GPS pour les gagner`
                : 'Activez le suivi GPS pour gagner des points'}
            </p>
          </>
        )}
      </div>

      <button
        type="button"
        onClick={onClose}
        aria-label="Fermer la notification"
        className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-text-subtle hover:text-text-muted hover:bg-surface-sunken transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <svg
          aria-hidden="true"
          width="10"
          height="10"
          viewBox="0 0 14 14"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <path d="M1 1l12 12M13 1L1 13" />
        </svg>
      </button>
    </div>
  )
}
