import type { FC } from 'react'
import { Modal } from './Modal'

interface TrackingConsentModalProps {
  onAccept: () => void
  onSkip: () => void
}

export const TrackingConsentModal: FC<TrackingConsentModalProps> = ({ onAccept, onSkip }) => {
  return (
    <Modal titleId="tracking-title" descriptionId="tracking-desc" onClose={onSkip}>
      <div
        className="w-12 h-12 bg-transit-surface rounded-full flex items-center justify-center mb-4"
        aria-hidden="true"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-transit"
        >
          <path d="M12 2a7 7 0 0 1 7 7c0 5.25-7 13-7 13S5 14.25 5 9a7 7 0 0 1 7-7Z" />
          <circle cx="12" cy="9" r="2.5" />
        </svg>
      </div>

      <h2 id="tracking-title" className="text-h3 font-semibold text-slate-900 mb-2">
        Suivi GPS en continu
      </h2>

      <p id="tracking-desc" className="text-body-sm text-slate-600 leading-relaxed mb-2">
        UrbanFlow peut suivre votre position GPS pendant ce trajet pour afficher votre avancement
        en temps réel et détecter automatiquement votre arrivée.
      </p>
      <p className="text-body-sm text-slate-500 leading-relaxed mb-6">
        Ce suivi s'arrête automatiquement à destination. Votre position n'est ni conservée ni
        transmise à des tiers.
      </p>

      <div className="flex flex-col gap-3">
        <button type="button" onClick={onAccept} className="btn-primary w-full justify-center">
          <svg
            aria-hidden="true"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
          Démarrer le suivi
        </button>
        <button type="button" onClick={onSkip} className="btn-secondary w-full justify-center">
          Enregistrer sans suivi GPS
        </button>
      </div>
    </Modal>
  )
}
