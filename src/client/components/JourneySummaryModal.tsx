import type { Journey } from '@shared/types/index'
import type { RecordTripResult } from '../services/gamification.service'

interface JourneySummaryModalProps {
  journey: Journey
  realDurationMin: number
  tripResult: RecordTripResult
  onClose: () => void
}

function formatDuration(min: number): string {
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m > 0 ? `${h}h${m.toString().padStart(2, '0')}` : `${h}h`
}

function formatCo2(grams: number): string {
  return grams >= 1000 ? `${(grams / 1000).toFixed(1)} kg` : `${grams} g`
}

export function JourneySummaryModal({
  journey,
  realDurationMin,
  tripResult,
  onClose,
}: JourneySummaryModalProps) {
  const diffMin = realDurationMin - journey.totalDurationMin

  return (
    <div
      className="fixed inset-0 z-modal flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0"
      style={{ backgroundColor: 'rgba(15, 23, 42, 0.5)' }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="summary-title"
        className="w-full max-w-sm bg-white rounded-card shadow-float p-6 animate-slide-up"
      >
        <div
          className="w-14 h-14 bg-eco-100 rounded-full flex items-center justify-center mx-auto mb-4"
          aria-hidden="true"
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-eco-600"
          >
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>

        <h2 id="summary-title" className="text-h3 font-bold text-slate-900 text-center mb-1">
          Trajet terminé !
        </h2>
        <p className="text-caption text-slate-400 text-center mb-6">
          +{tripResult.pointsEarned} pt{tripResult.pointsEarned > 1 ? 's' : ''} ·{' '}
          {formatCo2(tripResult.co2SavedGrams)} CO₂ économisés
        </p>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-slate-50 rounded-card p-3 text-center">
            <p className="text-caption text-slate-500 mb-1">Durée réelle</p>
            <p className="text-h3 font-bold text-slate-900 leading-none mt-1">
              {formatDuration(realDurationMin)}
            </p>
            {Math.abs(diffMin) >= 1 && (
              <p
                className={`text-caption mt-1 font-medium ${diffMin > 0 ? 'text-amber-600' : 'text-eco-600'}`}
              >
                {diffMin > 0 ? '+' : ''}
                {diffMin} min vs prévu
              </p>
            )}
          </div>
          <div className="bg-eco-50 rounded-card p-3 text-center">
            <p className="text-caption text-slate-500 mb-1">CO₂ économisé</p>
            <p className="text-h3 font-bold text-eco-700 leading-none mt-1">
              {formatCo2(tripResult.co2SavedGrams)}
            </p>
            <p className="text-caption text-slate-400 mt-1">vs voiture</p>
          </div>
        </div>

        <div className="flex items-center justify-between bg-slate-50 rounded-card px-4 py-3 mb-2">
          <span className="text-body-sm text-slate-600 font-medium">Points gagnés</span>
          <span className="text-h3 font-bold text-eco-700">+{tripResult.pointsEarned} pts</span>
        </div>
        <div className="flex items-center justify-between px-1 mb-5">
          <span className="text-caption text-slate-400">Total cumulé</span>
          <span className="text-body-sm font-semibold text-slate-700">
            {tripResult.totalPoints} pts
          </span>
        </div>

        {tripResult.newlyUnlockedBadges.length > 0 && (
          <div className="bg-amber-50 border border-amber-100 rounded-card px-4 py-3 mb-5">
            <p className="text-body-sm font-semibold text-amber-800">
              🏅{' '}
              {tripResult.newlyUnlockedBadges.length === 1
                ? '1 badge débloqué !'
                : `${tripResult.newlyUnlockedBadges.length} badges débloqués !`}
            </p>
          </div>
        )}

        <button type="button" onClick={onClose} className="btn-primary w-full justify-center">
          Fermer
        </button>
      </div>
    </div>
  )
}
