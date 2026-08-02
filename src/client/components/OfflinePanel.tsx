import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { getLastJourney } from '../utils/last-journey-cache'
import { useFocusTrap } from '../hooks/useFocusTrap'

function formatCo2(grams: number): string {
  return grams >= 1000
    ? `${(grams / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} kg`
    : `${grams} g`
}

function formatSavedAt(iso: string): string {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

/** État hors ligne (MAQUETTE.md §5.7 / 6.2) — recouvre la carte, propose ce
 * qui reste consultable (dernier itinéraire calculé, mis en cache localement,
 * et les pages qui ne dépendent pas du réseau carte/routage). */
export function OfflinePanel() {
  const lastJourney = getLastJourney()
  const dialogRef = useRef<HTMLDivElement>(null)
  // Rien à fermer : l'état se referme tout seul au retour du réseau (Échap no-op).
  useFocusTrap(dialogRef, () => {})

  return (
    <div className="fixed inset-0 z-[1200] flex flex-col">
      <div
        aria-hidden="true"
        className="flex-1"
        style={{
          backgroundImage:
            'repeating-linear-gradient(135deg, var(--color-surface-sunken) 0 12px, var(--color-surface-muted) 12px 24px)',
        }}
      />

      <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center gap-2.5 h-11 px-3.5 rounded-md bg-warning-surface border-[1.5px] border-warning-border">
        <svg aria-hidden="true" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className="text-warning shrink-0">
          <path d="M2 8.5a15 15 0 0 1 20 0M5.5 12a10 10 0 0 1 13 0M9 15.5a5 5 0 0 1 6 0M12 19h.01" />
          <path d="M4 4l16 16" />
        </svg>
        <span className="flex-1 text-body-sm font-semibold text-warning">Hors ligne — carte non disponible</span>
      </div>

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Mode hors ligne"
        className="bg-surface border-t border-border rounded-t-2xl px-4 pt-2.5 pb-4 flex flex-col gap-3"
      >
        <span aria-hidden="true" className="self-center w-10 h-1 rounded-full bg-border" />

        <div className="flex items-start gap-3">
          <span className="size-11 rounded-md bg-surface-sunken flex items-center justify-center shrink-0">
            <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-text-muted">
              <path d="M2 8.5a15 15 0 0 1 20 0M5.5 12a10 10 0 0 1 13 0M9 15.5a5 5 0 0 1 6 0M12 19h.01" />
              <path d="M4 4l16 16" />
            </svg>
          </span>
          <span className="flex flex-col gap-1">
            <span className="text-body-lg font-bold">Pas de connexion</span>
            <span className="text-body-sm text-text-muted leading-snug">
              Le calcul d'itinéraire reprendra dès le retour du réseau.
            </span>
          </span>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-caption font-bold tracking-[0.06em] uppercase text-text-subtle">
            Disponible hors ligne
          </span>

          {lastJourney && (
            <div className="flex items-center gap-3 p-3.5 rounded-md border border-border">
              <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-text-muted shrink-0">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3.5 2" />
              </svg>
              <span className="flex-1 flex flex-col gap-0.5 min-w-0">
                <span className="text-body-sm font-semibold truncate">
                  {lastJourney.fromLabel} → {lastJourney.toLabel}
                </span>
                <span className="text-caption text-text-muted">
                  Enregistré à {formatSavedAt(lastJourney.savedAt)} · {lastJourney.durationMin} min ·{' '}
                  −{formatCo2(lastJourney.co2SavedGrams)}
                </span>
              </span>
            </div>
          )}

          <Link
            to="/dashboard"
            className="flex items-center gap-3 p-3.5 rounded-md border border-border no-underline text-text"
          >
            <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-text-muted shrink-0">
              <path d="M6 20v-6M12 20V7M18 20v-9M3 20h18" />
            </svg>
            <span className="flex-1 text-body-sm font-semibold">Mes progrès et badges</span>
            <svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-muted shrink-0">
              <path d="M9 6l6 6-6 6" />
            </svg>
          </Link>
        </div>

        <button type="button" onClick={() => window.location.reload()} className="btn-primary w-full">
          <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 12a8 8 0 1 1-2.3-5.6M20 4v4h-4" />
          </svg>
          Réessayer
        </button>
      </div>
    </div>
  )
}
