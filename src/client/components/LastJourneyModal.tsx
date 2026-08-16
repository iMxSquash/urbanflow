import { Modal } from './Modal'
import type { CachedJourney } from '../utils/last-journey-cache'
import { formatCo2, formatSavedAt } from '../utils/format-journey'
import { MODE_ICON_PATH_BASE, MODE_LABELS, modeColorToken } from '../constants/mode-icons'

interface LastJourneyModalProps {
  journey: CachedJourney
  onClose: () => void
}

/** Détail du dernier trajet mis en cache (mode hors ligne de `MapSheet`) —
 * se limite aux champs présents dans `CachedJourney` : les étapes sont un
 * résumé texte (mode/ligne/durée/distance/noms de lieu, `CachedJourneyStep`),
 * jamais de géométrie ni de coordonnées — pas de carte à afficher hors ligne.
 * `journey.steps` est optionnel : un trajet mis en cache avant l'ajout de ce
 * champ n'en a pas, la section est alors simplement omise ; `fromName`/
 * `toName` par étape le sont aussi (arrêt/station non résolu par le
 * provider), la ligne "de où à où" est alors omise pour cette étape. */
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

      {journey.steps && journey.steps.length > 0 && (
        <div className="flex flex-col gap-2 mb-5">
          <p className="text-caption font-bold tracking-[0.06em] uppercase text-text-subtle">
            Étapes
          </p>
          <ol className="flex flex-col gap-2">
            {journey.steps.map((step, idx) => {
              const tokenName = modeColorToken(step.mode)
              return (
                <li
                  key={idx}
                  className="flex items-center gap-3 bg-surface-sunken rounded-xl px-3 py-2.5"
                >
                  <span
                    className="size-8 rounded-full flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: `var(--color-mode-${tokenName}-surface)`,
                      color: `var(--color-mode-${tokenName})`,
                    }}
                  >
                    <svg
                      aria-hidden="true"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.9"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      {MODE_ICON_PATH_BASE[step.mode]}
                    </svg>
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-body-sm font-medium text-text truncate">
                      {step.lineName ?? MODE_LABELS[step.mode]}
                    </span>
                    {step.fromName && step.toName && (
                      <span className="block text-caption text-text-muted truncate">
                        {step.fromName} → {step.toName}
                      </span>
                    )}
                    <span className="block text-caption text-text-subtle">
                      {step.durationMin} min
                      {step.distanceKm > 0 && ` · ${step.distanceKm} km`}
                    </span>
                  </span>
                </li>
              )
            })}
          </ol>
        </div>
      )}

      <button type="button" onClick={onClose} className="btn-primary w-full justify-center">
        Fermer
      </button>
    </Modal>
  )
}
