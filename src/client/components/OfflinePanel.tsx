import { useEffect, useRef, useState } from 'react'
import { getLastJourney, type CachedJourney } from '../utils/last-journey-cache'
import { useFocusTrap } from '../hooks/use-focus-trap'
import { useMediaQuery } from '../hooks/use-media-query'
import { LastJourneyModal } from './LastJourneyModal'

function formatCo2(grams: number): string {
  return grams >= 1000
    ? `${(grams / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} kg`
    : `${grams} g`
}

function formatSavedAt(iso: string): string {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

// Référence stable : une closure inline recréée à chaque rendu ferait
// dépendre l'effet de useFocusTrap (deps [ref, onEscape]) du rendu courant et
// re-déclencherait le focus initial (donc lui volerait le focus) à chaque
// re-render d'OfflinePanel — notamment à l'ouverture de LastJourneyModal.
function noop() {}

interface OfflinePanelProps {
  /** Force une relecture immédiate de la connectivité (navigator.onLine),
   * sans recharger la page ni rejouer le bootstrap applicatif (useAuthInit). */
  onRetry: () => void
}

/** État hors ligne (MAQUETTE.md §5.7 / 6.2) — recouvre la carte, propose ce
 * qui reste consultable (dernier itinéraire calculé, mis en cache localement,
 * et les pages qui ne dépendent pas du réseau carte/routage). */
export function OfflinePanel({ onRetry }: OfflinePanelProps) {
  const [lastJourney, setLastJourney] = useState<CachedJourney | null>(null)
  const [showLastJourneyDetail, setShowLastJourneyDetail] = useState(false)
  const dialogRef = useRef<HTMLDivElement>(null)
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  // Rien à fermer : l'état se referme tout seul au retour du réseau (Échap
  // no-op). Piège désactivé au clavier en desktop : le panneau y devient un
  // panneau latéral permanent à côté de la nav (toujours cliquable/visible),
  // pas un dialogue bloquant — le piéger empêcherait d'atteindre la nav au
  // Tab alors qu'elle reste utilisable à la souris, même incohérence que
  // MapSheet évite déjà via son propre `isDialog` (mobile uniquement).
  useFocusTrap(dialogRef, noop, !isDesktop)

  // Lecture IndexedDB locale, pas un appel réseau — un effet est le bon
  // outil ici (la règle CLAUDE.md "pas de useEffect pour les appels API"
  // cible les appels HTTP au backend, pas le stockage navigateur).
  useEffect(() => {
    let cancelled = false
    void getLastJourney().then((journey) => {
      if (!cancelled) setLastJourney(journey)
    })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    // z-modal : doit rester au-dessus de MapSheet (z-sheet, toujours monté,
    // même hors ligne) pour le recouvrir/remplacer, pas juste au-dessus de la
    // carte. z-navbar (30) est très inférieur à z-sheet (1100) : aucune
    // valeur de z-index unique ne peut à la fois dépasser le sheet et rester
    // sous la nav. La nav reste donc visible par géométrie, pas par
    // empilement — même technique que `.bottom-sheet` lui-même pour ses états
    // où la nav doit rester affichée (`max-lg:bottom-(--height-bottomnav)`
    // dans index.css) : le panneau s'arrête avant la bande occupée par la nav
    // fixe mobile au lieu de compter sur un z-index inférieur au sien. Même
    // logique côté desktop : la sidebar (`lg:static`, donc jamais recouverte
    // par un simple ordre de z-index face à un élément `fixed`) doit rester
    // dégagée, d'où `lg:left-[var(--width-sidebar)]` plutôt que `inset-x-0`.
    // `lg:flex-row` : ≥1024px, le contenu (banderole + dernier trajet +
    // réessayer) quitte le gabarit "bottom sheet mobile" pour devenir un
    // panneau latéral docké — même position/traitement que le panneau
    // desktop de MapSheet (`aside`, 400px, coin arrondi côté carte) plutôt
    // qu'une carte ancrée en bas avec poignée de balayage, geste tactile qui
    // n'a pas de sens au clavier/souris.
    <div className="fixed left-0 right-0 lg:left-[var(--width-sidebar)] top-0 max-lg:bottom-[var(--height-bottomnav)] lg:bottom-0 z-modal flex flex-col lg:flex-row">
      <div
        aria-hidden="true"
        className="flex-1"
        style={{
          backgroundImage:
            'repeating-linear-gradient(135deg, var(--color-surface-sunken) 0 12px, var(--color-surface-muted) 12px 24px)',
        }}
      />

      {/* Redondant en desktop : le panneau docké ci-dessous porte déjà "Pas
       * de connexion" — cette banderole n'a de sens que flottant sur la
       * carte hachurée plein écran mobile. */}
      <div className="absolute top-3.5 left-3.5 right-3.5 lg:hidden flex items-center gap-2.5 h-11 px-3.5 rounded-md bg-warning-surface border-[1.5px] border-warning-border">
        <svg
          aria-hidden="true"
          width="17"
          height="17"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-warning shrink-0"
        >
          <path d="M2 8.5a15 15 0 0 1 20 0M5.5 12a10 10 0 0 1 13 0M9 15.5a5 5 0 0 1 6 0M12 19h.01" />
          <path d="M4 4l16 16" />
        </svg>
        <span className="flex-1 text-body-sm font-semibold text-warning">
          Hors ligne — carte non disponible
        </span>
      </div>

      {/* Même chrome visuel que .bottom-sheet (index.css) — surface, bordure,
       * arrondi, ombre — sans réutiliser la classe elle-même : `.bottom-sheet`
       * porte aussi `z-sheet` et le pilotage par `SheetState`, hors sujet ici.
       * `lg:order-first` : premier enfant du flex-row desktop ci-dessus, donc
       * à gauche (contre la sidebar) — le fond hachué (dernier enfant, ordre
       * par défaut) occupe le reste, à droite, à la place de la carte. */}
      <div
        ref={dialogRef}
        role={isDesktop ? undefined : 'dialog'}
        aria-modal={isDesktop ? undefined : true}
        aria-label="Mode hors ligne"
        className="bg-surface border-t border-border max-lg:rounded-t-2xl max-lg:shadow-sheet lg:order-first lg:w-100 lg:min-w-95 lg:border-t-0 lg:rounded-r-2xl lg:shadow-card px-4 pt-2 pb-3 flex flex-col gap-3"
      >
        {/* Poignée de balayage : affordance tactile, sans équivalent/sens au
         * clavier-souris — masquée sur le panneau docké desktop. */}
        <span aria-hidden="true" className="self-center bottom-sheet-handle lg:hidden" />

        <div className="flex items-start gap-3">
          <span className="size-11 rounded-md bg-surface-sunken flex items-center justify-center shrink-0">
            <svg
              aria-hidden="true"
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-text-muted"
            >
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

        {/* Le reste (dashboard, récompenses, profil...) ne dépend pas du
         * réseau et reste atteignable via la nav, désormais visible
         * au-dessus de ce panneau — pas besoin d'un raccourci dédié ici. */}
        {lastJourney && (
          <div className="flex flex-col gap-1.5">
            <span className="text-caption font-bold tracking-[0.06em] uppercase text-text-subtle">
              Disponible hors ligne
            </span>

            <button
              type="button"
              onClick={() => setShowLastJourneyDetail(true)}
              aria-label={`Voir le détail du dernier trajet, ${lastJourney.fromLabel} vers ${lastJourney.toLabel}`}
              className="flex items-center gap-3 p-3.5 rounded-md border border-border text-left"
            >
              <svg
                aria-hidden="true"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-text-muted shrink-0"
              >
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3.5 2" />
              </svg>
              <span className="flex-1 flex flex-col gap-0.5 min-w-0">
                <span className="text-body-sm font-semibold truncate">
                  {lastJourney.fromLabel} → {lastJourney.toLabel}
                </span>
                <span className="text-caption text-text-muted">
                  Enregistré à {formatSavedAt(lastJourney.savedAt)} · {lastJourney.durationMin} min
                  · −{formatCo2(lastJourney.co2SavedGrams)}
                </span>
              </span>
              <svg
                aria-hidden="true"
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-text-muted shrink-0"
              >
                <path d="M9 6l6 6-6 6" />
              </svg>
            </button>
          </div>
        )}

        <button type="button" onClick={onRetry} className="btn-primary w-full">
          <svg
            aria-hidden="true"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20 12a8 8 0 1 1-2.3-5.6M20 4v4h-4" />
          </svg>
          Réessayer
        </button>
      </div>

      {/* Rendu hors de `dialogRef` (pas un enfant du conteneur piégé par
       * useFocusTrap ci-dessus) : `LastJourneyModal` gère son propre piège de
       * focus via `Modal` — l'imbriquer sous `dialogRef` ferait courir les
       * deux pièges sur le même sous-arbre DOM et se disputer le focus. */}
      {showLastJourneyDetail && lastJourney && (
        <LastJourneyModal journey={lastJourney} onClose={() => setShowLastJourneyDetail(false)} />
      )}
    </div>
  )
}
