import { type FC, useEffect, useRef } from 'react'

interface GeolocationConsentProps {
  onGrant: () => void
  onDeny: () => void
}

export const GeolocationConsent: FC<GeolocationConsentProps> = ({ onGrant, onDeny }) => {
  const modalRef = useRef<HTMLDivElement>(null)

  // Focus trap + Escape
  useEffect(() => {
    const modal = modalRef.current
    if (!modal) return

    const focusable = modal.querySelectorAll<HTMLElement>(
      'button, [href], input, [tabindex]:not([tabindex="-1"])',
    )
    const first = focusable[0]
    const last = focusable[focusable.length - 1]

    first?.focus()

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onDeny()
        return
      }
      if (e.key === 'Tab') {
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last?.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first?.focus()
        }
      }
    }

    modal.addEventListener('keydown', onKeyDown)
    return () => modal.removeEventListener('keydown', onKeyDown)
  }, [onDeny])

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-modal flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0"
      style={{ backgroundColor: 'rgba(15, 23, 42, 0.5)' }}
    >
      {/* Dialog */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="geoloc-title"
        aria-describedby="geoloc-desc"
        className="w-full max-w-sm bg-white rounded-card shadow-float p-6 animate-slide-up"
      >
        {/* Icône */}
        <div className="w-12 h-12 bg-eco-50 rounded-full flex items-center justify-center mb-4" aria-hidden="true">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            className="text-eco-600">
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
          UrbanFlow utilise votre géolocalisation pour centrer la carte et suggérer
          des itinéraires depuis votre position actuelle.
        </p>
        <p className="text-body-sm text-slate-500 leading-relaxed mb-6">
          Vos données GPS ne sont pas transmises à des tiers et ne sont pas conservées
          au-delà de la session.
        </p>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={onGrant}
            className="btn-primary w-full"
          >
            Autoriser ma position
          </button>
          <button
            type="button"
            onClick={onDeny}
            className="btn-secondary w-full"
          >
            Saisir une adresse manuellement
          </button>
        </div>
      </div>
    </div>
  )
}
