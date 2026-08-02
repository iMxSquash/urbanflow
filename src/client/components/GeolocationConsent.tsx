import type { FC } from 'react'
import { Modal } from './Modal'

interface GeolocationConsentProps {
  onGrant: () => void
  onDeny: () => void
}

export const GeolocationConsent: FC<GeolocationConsentProps> = ({ onGrant, onDeny }) => {
  return (
    <Modal titleId="geoloc-title" descriptionId="geoloc-desc" onClose={onDeny}>
      {/* Icône */}
      <div
        className="w-12 h-12 bg-primary-surface rounded-full flex items-center justify-center mb-4"
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
          className="text-primary"
        >
          <path d="M12 2a7 7 0 0 1 7 7c0 5.25-7 13-7 13S5 14.25 5 9a7 7 0 0 1 7-7Z" />
          <circle cx="12" cy="9" r="2.5" />
        </svg>
      </div>

      {/* Titre */}
      <h2 id="geoloc-title" className="text-h3 font-semibold text-slate-900 mb-2">
        Utiliser votre position ?
      </h2>

      {/* Description RGPD */}
      <p id="geoloc-desc" className="text-body-sm text-slate-600 leading-relaxed mb-2">
        UrbanFlow utilise votre géolocalisation pour centrer la carte et suggérer des itinéraires
        depuis votre position actuelle.
      </p>
      <p className="text-body-sm text-slate-500 leading-relaxed mb-6">
        Vos données GPS ne sont pas transmises à des tiers et ne sont pas conservées au-delà de la
        session.
      </p>

      {/* Actions — même poids visuel, aucune présélectionnée (RGPD) */}
      <div className="flex flex-col gap-3">
        <button type="button" onClick={onGrant} className="btn-primary w-full">
          Autoriser ma position
        </button>
        <button type="button" onClick={onDeny} className="btn-secondary w-full">
          Saisir une adresse manuellement
        </button>
      </div>
    </Modal>
  )
}
