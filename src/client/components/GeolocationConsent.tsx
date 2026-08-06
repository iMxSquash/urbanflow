import type { FC } from 'react'
import { Modal } from './Modal'

interface GeolocationConsentProps {
  onGrant: () => void
  onDeny: () => void
}

const GUARANTEES = [
  'Utilisée pendant le trajet, puis désactivée',
  'Jamais transmise à un tiers ni utilisée pour de la publicité',
  'Révocable à tout moment dans Paramètres',
]

export const GeolocationConsent: FC<GeolocationConsentProps> = ({ onGrant, onDeny }) => {
  return (
    <Modal titleId="geoloc-title" descriptionId="geoloc-desc" onClose={onDeny}>
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
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-primary"
        >
          <path d="M12 22s7-6.5 7-12A7 7 0 0 0 5 10c0 5.5 7 12 7 12z" />
          <circle cx="12" cy="10" r="2.6" />
        </svg>
      </div>

      <h2 id="geoloc-title" className="text-h3 font-bold text-text mb-2">
        Utiliser votre position pour ce trajet ?
      </h2>

      <p id="geoloc-desc" className="text-body-sm text-text-muted leading-relaxed mb-3">
        Votre position sert uniquement à trouver le point de départ et à suivre le trajet en cours.
        Elle n'est pas partagée et n'est pas conservée après le trajet.
      </p>

      <ul className="flex flex-col gap-2 mb-4">
        {GUARANTEES.map((item) => (
          <li key={item} className="flex items-start gap-2.5 text-body-sm text-text">
            <svg
              aria-hidden="true"
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-primary shrink-0 mt-0.5"
            >
              <path d="M20 6L9 17l-5-5" />
            </svg>
            {item}
          </li>
        ))}
      </ul>

      <div className="flex items-start gap-2.5 p-3 rounded-md bg-surface-sunken mb-6">
        <svg
          aria-hidden="true"
          width="17"
          height="17"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-text-muted shrink-0 mt-0.5"
        >
          <rect x="4" y="10" width="16" height="10" rx="2.5" />
          <path d="M8 10V7a4 4 0 0 1 8 0v3" />
        </svg>
        <p className="text-caption text-text-muted leading-relaxed">
          Refuser ne bloque rien : vous pourrez saisir votre départ à la main et utiliser toutes les
          fonctions.
        </p>
      </div>

      {/* Même poids visuel, aucune présélectionnée (RGPD) */}
      <div className="flex flex-col gap-3">
        <button type="button" onClick={onGrant} className="btn-primary w-full">
          Autoriser pour ce trajet
        </button>
        <button type="button" onClick={onDeny} className="btn-secondary w-full">
          Saisir mon départ manuellement
        </button>
      </div>
    </Modal>
  )
}
