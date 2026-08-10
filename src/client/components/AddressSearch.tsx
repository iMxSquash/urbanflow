import { useId, useRef, useState } from 'react'
import type { Coordinates } from '@shared/types/index'
import { useAddressAutocomplete } from '../hooks/use-address-autocomplete'
import { AddressSuggestionsList } from './AddressSuggestionsList'
import { Spinner } from './Spinner'

interface AddressSearchProps {
  onSelect: (coords: Coordinates, label: string) => void
  placeholder?: string
  label?: string
  /** Coordonnées de référence pour la colonne distance des suggestions —
   * MAQUETTE.md §5.2 état 2 (distance départ → chaque suggestion d'arrivée).
   * Omis pour le champ départ (aucune référence pertinente). */
  originCoords?: Coordinates | null
}

/** Champ d'adresse autonome avec popover flottant — utilisé sur le panneau
 * desktop (`DesktopPanel`, toujours visible, pas de contrainte d'espace en
 * dessous). Le sheet mobile utilise directement `useAddressAutocomplete` +
 * `AddressSuggestionsList` pour afficher les suggestions en ligne plutôt
 * qu'en popover (`MapSheet.tsx` → `SearchView`, MIGRATION-TODO.md étape 6). */
export function AddressSearch({
  onSelect,
  placeholder = 'Rechercher une adresse de départ...',
  label = 'Rechercher une adresse de départ',
  originCoords,
}: AddressSearchProps) {
  const [open, setOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const inputId = useId()
  const listId = useId()

  const {
    query,
    setQuery,
    results,
    loading,
    activeIndex,
    recents,
    refreshRecents,
    handleKeyDown,
    selectResult,
    selectRecent,
  } = useAddressAutocomplete(onSelect, originCoords)

  return (
    <div className="relative">
      <label htmlFor={inputId} className="sr-only">
        {label}
      </label>
      <div className="relative flex items-center">
        <span className="absolute left-3 text-text-subtle pointer-events-none" aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.5" />
            <path
              d="m10 10 2.5 2.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </span>
        <input
          ref={inputRef}
          id={inputId}
          type="search"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={activeIndex >= 0 ? `${listId}-option-${activeIndex}` : undefined}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onKeyDown={(e) => handleKeyDown(e, { onEscape: () => setOpen(false) })}
          onFocus={() => {
            refreshRecents()
            setOpen(true)
          }}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder={placeholder}
          autoComplete="off"
          className="input pl-9 bg-surface shadow-card-md"
        />
        {loading && (
          <span className="absolute right-3 pointer-events-none" aria-label="Recherche en cours">
            <Spinner />
          </span>
        )}
      </div>

      {/* Annonce le nombre de résultats — MAQUETTE.md §5.2 état 2 */}
      <p role="status" className="sr-only">
        {open && !loading
          ? `${results.length} adresse${results.length > 1 ? 's' : ''} trouvée${results.length > 1 ? 's' : ''}`
          : ''}
      </p>

      {open && (
        <AddressSuggestionsList
          listId={listId}
          query={query}
          results={results}
          activeIndex={activeIndex}
          recents={recents}
          originCoords={originCoords}
          onSelectResult={(r) => {
            selectResult(r)
            setOpen(false)
          }}
          onSelectRecent={(r) => {
            selectRecent(r)
            setOpen(false)
          }}
          className="absolute top-full left-0 right-0 mt-1 bg-surface rounded-card shadow-card-lg border border-border overflow-hidden z-overlay max-h-80 overflow-y-auto"
        />
      )}
    </div>
  )
}
