import { useEffect } from 'react'

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

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={
        pointsEarned > 0
          ? `Trajet enregistré. +${pointsEarned} points. ${formatCo2(co2SavedGrams)} de CO₂ économisés.`
          : `Trajet enregistré sans suivi GPS. ${formatCo2(co2SavedGrams)} de CO₂ économisés. Activez le suivi GPS pour gagner des points.`
      }
      className="absolute top-20 left-1/2 -translate-x-1/2 z-[1200] animate-slide-up w-max max-w-[calc(100vw-2rem)]"
    >
      <div className="bg-white rounded-xl border border-eco-200 shadow-card-md px-4 py-3 flex items-start gap-3">
        <div
          aria-hidden="true"
          className="shrink-0 w-9 h-9 rounded-full bg-eco-100 flex items-center justify-center"
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
            className="text-eco-600"
          >
            <path d="M17 8C8 10 5.9 16.17 3.82 22c2 0 7.68-1 13-6 2-2 3-5 3-8s-1-5-1-5l-1.82 5z" />
          </svg>
        </div>

        <div className="min-w-0">
          {pointsEarned > 0 ? (
            <>
              <p className="text-body-sm font-bold text-slate-900 leading-snug">
                Bon trajet !{' '}
                <span className="text-eco-700">
                  +{pointsEarned} pt{pointsEarned > 1 ? 's' : ''}
                </span>
              </p>
              <p className="text-caption text-eco-700 mt-0.5">
                {formatCo2(co2SavedGrams)} CO₂ économisés vs voiture
              </p>
              <p className="text-caption text-slate-400 mt-0.5">
                Total cumulé : <span className="font-medium text-slate-600">{totalPoints} pts</span>
              </p>
              {newlyUnlockedBadges.length > 0 && (
                <p className="text-caption text-amber-600 font-medium mt-1">
                  🏅{' '}
                  {newlyUnlockedBadges.length === 1
                    ? '1 badge débloqué !'
                    : `${newlyUnlockedBadges.length} badges débloqués !`}
                </p>
              )}
            </>
          ) : (
            <>
              <p className="text-body-sm font-bold text-slate-900 leading-snug">
                Trajet enregistré
              </p>
              <p className="text-caption text-eco-700 mt-0.5">
                {formatCo2(co2SavedGrams)} CO₂ économisés vs voiture
              </p>
              <p className="text-caption text-slate-400 mt-0.5">
                Activez le suivi GPS pour gagner des points
              </p>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer la notification"
          className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eco-600"
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
    </div>
  )
}
