import { useEffect, useRef, useState } from 'react'
import type { Coordinates } from '@shared/types/index'
import { addRecentSearch, getRecentSearches } from '../utils/recent-searches'
import type { RecentSearch } from '../utils/recent-searches'

export interface NominatimAddress {
  city?: string
  town?: string
  village?: string
  municipality?: string
  suburb?: string
}

export interface NominatimResult {
  place_id: number
  display_name: string
  lat: string
  lon: string
  class?: string
  type?: string
  address?: NominatimAddress
}

// Viewbox biaisé vers Nantes Métropole, sans strict bound
const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org/search'
const NANTES_VIEWBOX = '-2.1,47.0,-1.0,47.5'

/** Logique de recherche d'adresse (Nominatim + récents) partagée entre le
 * popover autonome desktop (`AddressSearch`) et les champs inline du sheet
 * mobile (`MapSheet.tsx` → `SearchView`) — un seul endroit pour la requête
 * debounced, la sélection et la mise à jour des récents (MIGRATION-TODO.md
 * étape 6). Ne gère pas l'ouverture/fermeture d'un popover : c'est à la
 * charge de l'appelant (différent selon le lieu d'affichage). */
export function useAddressAutocomplete(
  onSelect: (coords: Coordinates, label: string) => void,
  originCoords?: Coordinates | null,
  initialQuery = ''
) {
  const [query, setQueryState] = useState(initialQuery)
  const [results, setResults] = useState<NominatimResult[]>([])
  const [loading, setLoading] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [recents, setRecents] = useState<RecentSearch[]>(() => getRecentSearches())
  const abortRef = useRef<AbortController | null>(null)
  // Évite qu'une sélection ne redéclenche sa propre recherche : setQueryState(label)
  // dans commitSelection fait repasser query à ≥3 caractères, ce qui rouvrirait le
  // dropdown 300ms plus tard avec les mêmes résultats sans intervention de l'utilisateur.
  // Même garde au montage si le champ démarre déjà rempli (`initialQuery` — réouverture
  // de la saisie depuis `mid` avec une adresse déjà choisie, cf. MapSheet.tsx).
  const justSelectedRef = useRef(initialQuery.length > 0)

  useEffect(() => {
    if (justSelectedRef.current) {
      justSelectedRef.current = false
      return
    }
    if (query.length < 3) return

    const timer = setTimeout(async () => {
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller

      setLoading(true)
      try {
        const params = new URLSearchParams({
          format: 'json',
          limit: '5',
          countrycodes: 'fr',
          addressdetails: '1',
          q: query,
          viewbox: NANTES_VIEWBOX,
        })
        const res = await fetch(`${NOMINATIM_BASE}?${params}`, {
          signal: controller.signal,
          headers: { 'Accept-Language': 'fr' },
        })
        const data = (await res.json()) as NominatimResult[]
        setResults(data)
        setActiveIndex(-1)
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setResults([])
        }
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  function setQuery(val: string) {
    setQueryState(val)
    if (val.length < 3) setResults([])
  }

  // Réécrit le champ sans relancer de recherche Nominatim — utilisé quand le
  // texte affiché doit refléter une adresse déjà résolue ailleurs (ex. bouton
  // "Inverser départ et arrivée" dans `SearchView`, qui échange les deux
  // champs sans que l'utilisateur n'ait retapé quoi que ce soit).
  function setQuietQuery(val: string) {
    justSelectedRef.current = true
    setQueryState(val)
    setResults([])
  }

  function refreshRecents() {
    setRecents(getRecentSearches())
  }

  function commitSelection(coords: Coordinates, resultLabel: string) {
    onSelect(coords, resultLabel)
    addRecentSearch({ label: resultLabel, ...coords })
    refreshRecents()
    justSelectedRef.current = true
    setQueryState(resultLabel)
    setResults([])
  }

  function selectResult(result: NominatimResult) {
    const primaryLabel = result.display_name.split(',').slice(0, 2).join(',').trim()
    commitSelection({ lat: parseFloat(result.lat), lng: parseFloat(result.lon) }, primaryLabel)
  }

  function selectRecent(recent: RecentSearch) {
    commitSelection({ lat: recent.lat, lng: recent.lng }, recent.label)
  }

  // Suggestions et récents partagent un seul espace d'index (résultats
  // d'abord, puis récents — même ordre que `AddressSuggestionsList`) pour
  // que ↑↓/Entrée fonctionnent aussi sur les récents : avant ce correctif,
  // le guard `results.length === 0` bloquait toute navigation clavier dès
  // qu'aucune recherche n'était encore lancée, exactement le cas où seuls
  // les récents sont affichés. `recentsShown` reprend la même condition que
  // `showRecents` côté affichage (`query.length < 3`), sinon ↓ pourrait
  // sélectionner un récent invisible à l'écran.
  function handleKeyDown(e: React.KeyboardEvent, { onEscape }: { onEscape?: () => void } = {}) {
    const recentsShown = query.length < 3
    const totalCount = results.length + (recentsShown ? recents.length : 0)
    if (totalCount === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, totalCount - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, -1))
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault()
      if (activeIndex < results.length) {
        selectResult(results[activeIndex])
      } else {
        const recent = recents[activeIndex - results.length]
        if (recent) selectRecent(recent)
      }
    } else if (e.key === 'Escape') {
      setActiveIndex(-1)
      onEscape?.()
    }
  }

  return {
    query,
    setQuery,
    setQuietQuery,
    results,
    loading,
    activeIndex,
    recents,
    refreshRecents,
    handleKeyDown,
    selectResult,
    selectRecent,
    originCoords,
  }
}

export type AddressAutocomplete = ReturnType<typeof useAddressAutocomplete>
