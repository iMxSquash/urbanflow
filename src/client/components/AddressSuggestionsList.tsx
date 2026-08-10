import type { ReactNode } from 'react'
import type { Coordinates } from '@shared/types/index'
import type { NominatimResult } from '../hooks/use-address-autocomplete'
import { formatRecentTimestamp } from '../utils/recent-searches'
import type { RecentSearch } from '../utils/recent-searches'

// ── Classification des résultats Nominatim → icône + libellé de type ────────
// Un seul jeu d'icônes (3 formes) fidèle à la maquette (`1a Estuaire -
// Écrans.dc.html`, état 2) : bâtiment/POI, rue, lieu.

type SuggestionKind = 'poi' | 'street' | 'place'

function classifySuggestion(result: NominatimResult): { kind: SuggestionKind; typeLabel: string } {
  const { class: cls, type } = result
  if (cls === 'highway') return { kind: 'street', typeLabel: 'Rue' }
  if (cls === 'place') return { kind: 'place', typeLabel: 'Lieu' }
  if (
    cls === 'railway' ||
    cls === 'public_transport' ||
    type === 'bus_stop' ||
    type === 'tram_stop' ||
    type === 'station'
  ) {
    return { kind: 'poi', typeLabel: 'Arrêt' }
  }
  return { kind: 'poi', typeLabel: type ? type.replace(/_/g, ' ') : 'Lieu' }
}

function cityOf(result: NominatimResult): string {
  const a = result.address
  return a?.city ?? a?.town ?? a?.village ?? a?.municipality ?? a?.suburb ?? ''
}

const SUGGESTION_ICON_PATHS: Record<SuggestionKind, ReactNode> = {
  poi: (
    <>
      <rect x="5" y="3" width="14" height="14" rx="3" />
      <path d="M5 11h14M8 21l2-4M16 21l-2-4M3 21h18" />
    </>
  ),
  street: (
    <>
      <path d="M12 22s7-6.5 7-12A7 7 0 0 0 5 10c0 5.5 7 12 7 12z" />
      <circle cx="12" cy="10" r="2.4" />
    </>
  ),
  place: <path d="M4 20V9l8-5 8 5v11M9 20v-6h6v6" />,
}

function SuggestionIcon({ kind, active }: { kind: SuggestionKind; active: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
        active ? 'bg-primary' : 'bg-surface-sunken'
      }`}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={active ? 'text-on-primary' : 'text-text-muted'}
      >
        {SUGGESTION_ICON_PATHS[kind]}
      </svg>
    </span>
  )
}

// Portion du libellé correspondant à la saisie, mise en gras et teintée
// (maquette : `<b style="color:#0B5C43">`).
function HighlightMatch({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return <>{text}</>
  return (
    <>
      {text.slice(0, idx)}
      <b className="text-primary">{text.slice(idx, idx + query.length)}</b>
      {text.slice(idx + query.length)}
    </>
  )
}

function haversineKm(a: Coordinates, b: Coordinates): number {
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const lat1 = (a.lat * Math.PI) / 180
  const lat2 = (b.lat * Math.PI) / 180
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

function formatDistanceKm(km: number): string {
  return `${km.toFixed(1).replace('.', ',')} km`
}

function RecentIcon() {
  return (
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
  )
}

export interface AddressSuggestionsListProps {
  listId: string
  query: string
  results: NominatimResult[]
  activeIndex: number
  recents: RecentSearch[]
  originCoords?: Coordinates | null
  onSelectResult: (result: NominatimResult) => void
  onSelectRecent: (recent: RecentSearch) => void
  className?: string
}

/** Contenu du statut + de la liste de suggestions + des récents — extrait
 * pour être réutilisé tel quel dans le popover flottant desktop
 * (`AddressSearch`) et dans la zone inline du sheet mobile (`SearchView`,
 * MIGRATION-TODO.md étape 6 : "pas en popup, directement sous les champs").
 *
 * Suggestions et récents partagent un seul espace d'index (`activeIndex` du
 * hook `useAddressAutocomplete` : 0..results.length-1 pour les suggestions,
 * puis results.length.. pour les récents) afin que ↑↓/Entrée/Échap
 * fonctionnent identiquement sur les deux — les récents étaient auparavant
 * de vrais `<button>` isolés, hors du modèle combobox, donc inatteignables
 * au clavier depuis le champ. Le `role="listbox"` porte maintenant sur le
 * conteneur englobant (pas seulement sur le `<ul>` des suggestions) pour que
 * `aria-controls`/`aria-activedescendant` du champ référencent bien un seul
 * ensemble cohérent. */
export function AddressSuggestionsList({
  listId,
  query,
  results,
  activeIndex,
  recents,
  originCoords,
  onSelectResult,
  onSelectRecent,
  className = '',
}: AddressSuggestionsListProps) {
  const showSuggestions = results.length > 0
  const showRecents = query.length < 3 && recents.length > 0

  if (!showSuggestions && !showRecents) return null

  return (
    <div id={listId} role="listbox" aria-label="Suggestions d'adresses" className={className}>
      {showSuggestions && (
        <>
          <div
            aria-hidden="true"
            className="flex items-center gap-2 px-3 pt-2.5 pb-1.5 text-caption text-text-muted"
          >
            <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
            {results.length} adresse{results.length > 1 ? 's' : ''} trouvée
            {results.length > 1 ? 's' : ''}
          </div>
          <ul className="p-1">
            {results.map((result, index) => {
              const { kind, typeLabel } = classifySuggestion(result)
              const primaryLabel = result.display_name.split(',')[0].trim()
              const city = cityOf(result)
              const active = index === activeIndex
              const distanceKm =
                originCoords &&
                formatDistanceKm(
                  haversineKm(originCoords, {
                    lat: parseFloat(result.lat),
                    lng: parseFloat(result.lon),
                  })
                )
              return (
                <li
                  key={result.place_id}
                  id={`${listId}-option-${index}`}
                  role="option"
                  aria-selected={active}
                  onMouseDown={() => onSelectResult(result)}
                  title={result.display_name}
                  className={`flex items-center gap-3 px-2.5 py-2 rounded-lg cursor-pointer border transition-colors duration-fast ${
                    active
                      ? 'bg-primary-surface border-primary'
                      : 'border-transparent hover:bg-surface-muted'
                  }`}
                >
                  <SuggestionIcon kind={kind} active={active} />
                  <span className="flex-1 min-w-0 flex flex-col">
                    <span className="text-body-sm font-semibold text-text truncate">
                      <HighlightMatch text={primaryLabel} query={query} />
                    </span>
                    <span className="text-caption text-text-muted truncate">
                      {typeLabel}
                      {city && ` · ${city}`}
                    </span>
                  </span>
                  {distanceKm && (
                    <span className="text-caption text-text-muted tabular-nums shrink-0">
                      {distanceKm}
                    </span>
                  )}
                </li>
              )
            })}
          </ul>
        </>
      )}

      {showRecents && (
        <div
          className={`flex flex-col gap-0.5 p-1 ${showSuggestions ? 'border-t border-surface-sunken' : ''}`}
        >
          <span className="text-caption font-bold tracking-wide uppercase text-text-subtle px-2 py-1.5">
            Récents
          </span>
          <ul>
            {recents.map((recent, index) => {
              const combinedIndex = results.length + index
              const active = combinedIndex === activeIndex
              return (
                <li
                  key={recent.label + recent.savedAt}
                  id={`${listId}-option-${combinedIndex}`}
                  role="option"
                  aria-selected={active}
                  onMouseDown={() => onSelectRecent(recent)}
                  className={`flex items-center gap-3 px-2.5 py-2 rounded-lg cursor-pointer transition-colors duration-fast ${
                    active ? 'bg-primary-surface' : 'hover:bg-surface-muted'
                  }`}
                >
                  <RecentIcon />
                  <span className="flex-1 min-w-0 text-body-sm font-medium text-text truncate">
                    {recent.label}
                  </span>
                  <span className="text-caption text-text-muted shrink-0">
                    {formatRecentTimestamp(recent.savedAt)}
                  </span>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
