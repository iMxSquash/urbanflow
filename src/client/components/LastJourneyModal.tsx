import { Modal } from './Modal'
import type { CachedJourney } from '../utils/last-journey-cache'
import { formatCo2, formatSavedAt } from '../utils/format-journey'

interface LastJourneyModalProps {
  journey: CachedJourney
  onClose: () => void
}

/** Détail du dernier trajet mis en cache (mode hors ligne de `MapSheet`) —
 * se limite aux champs présents dans `CachedJourney` (résumé, pas de
 * géométrie de trajet stockée) : pas de carte ni de segments à afficher
 * hors ligne. */
export function LastJourneyModal({ journey, onClose }: LastJourneyModalProps) {
  return (
    <Modal titleId="last-journey-title" descriptionId="last-journey-desc" onClose={onClose}>
      <h2 id="last-journey-title" className="text-h3 font-bold text-text mb-1">
        Dernier trajet
      </h2>
      <p id="last-journey-desc" className="text-body-sm text-text-muted leading-snug mb-4">
        Enregistré à {formatSavedAt(journey.savedAt)}, avant la perte de connexion.
      </p>

      <div className="flex items-center gap-3 bg-surface-sunken rounded-xl px-4 py-3 mb-3">
        <span className="flex-1 text-body-sm font-semibold text-text break-words">
          {journey.fromLabel}
        </span>
        <svg
          aria-hidden="true"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-text-muted shrink-0"
        >
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
        <span className="flex-1 text-body-sm font-semibold text-text text-right break-words">
          {journey.toLabel}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-surface-sunken rounded-xl p-3 text-center">
          <p className="text-caption text-text-subtle mb-1">Durée</p>
          <p className="text-h3 font-bold text-text leading-none mt-1">{journey.durationMin} min</p>
        </div>
        <div className="bg-primary-surface rounded-xl p-3 text-center">
          <p className="text-caption text-text-subtle mb-1">CO₂ économisé</p>
          <p className="text-h3 font-bold text-primary leading-none mt-1">
            {formatCo2(journey.co2SavedGrams)}
          </p>
        </div>
      </div>

      <button type="button" onClick={onClose} className="btn-primary w-full justify-center">
        Fermer
      </button>
    </Modal>
  )
}
