import { Modal } from './Modal'

interface EndTripConfirmModalProps {
  onCancel: () => void
  onConfirm: () => void
}

/** Confirmation avant "Terminer le trajet" — arrête le suivi GPS, pas une
 * perte de données comme la suppression de compte : icône/bouton `primary`,
 * pas `danger` (cf. DeleteAccountModal pour le pendant destructif). */
export function EndTripConfirmModal({ onCancel, onConfirm }: EndTripConfirmModalProps) {
  return (
    <Modal titleId="end-trip-title" descriptionId="end-trip-desc" onClose={onCancel}>
      <div
        className="w-13 h-13 bg-primary-surface rounded-xl flex items-center justify-center mb-4"
        aria-hidden="true"
      >
        <svg
          width="26"
          height="26"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-primary"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" />
        </svg>
      </div>

      <h2 id="end-trip-title" className="text-h3 font-bold mb-2">
        Terminer le trajet ?
      </h2>
      <p id="end-trip-desc" className="text-body-sm text-text-muted leading-relaxed mb-4">
        Le suivi GPS sera arrêté et ce trajet enregistré comme terminé.
      </p>

      <div className="flex flex-col gap-2">
        <button type="button" onClick={onConfirm} className="btn-primary w-full justify-center">
          Terminer le trajet
        </button>
        <button type="button" onClick={onCancel} className="btn-secondary w-full justify-center">
          Continuer le trajet
        </button>
      </div>
    </Modal>
  )
}
