import { type FC, useEffect, useRef } from 'react'

interface TrackingConsentModalProps {
  onAccept: () => void
  onSkip: () => void
}

export const TrackingConsentModal: FC<TrackingConsentModalProps> = ({ onAccept, onSkip }) => {
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const modal = modalRef.current
    if (!modal) return

    const focusable = modal.querySelectorAll<HTMLElement>(
      'button, [href], input, [tabindex]:not([tabindex="-1"])'
    )
    const first = focusable[0]
    const last = focusable[focusable.length - 1]

    first?.focus()

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onSkip()
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
  }, [onSkip])

  return (
    <div
      className="fixed inset-0 z-modal flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0"
      style={{ backgroundColor: 'rgba(15, 23, 42, 0.5)' }}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tracking-title"
        aria-describedby="tracking-desc"
        className="w-full max-w-sm bg-white rounded-card shadow-float p-6 animate-slide-up"
      >
        <div
          className="w-12 h-12 bg-transit-50 rounded-full flex items-center justify-center mb-4"
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
            className="text-transit-600"
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
      </div>
    </div>
  )
}
