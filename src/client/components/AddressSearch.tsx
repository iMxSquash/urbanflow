import { useEffect, useRef, useState } from 'react'
import type { Coordinates } from '@shared/types/index'

interface NominatimResult {
  place_id: number
  display_name: string
  lat: string
  lon: string
}

// Viewbox biaisé vers Nantes Métropole, sans strict bound
const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org/search'
const NANTES_VIEWBOX = '-2.1,47.0,-1.0,47.5'

interface AddressSearchProps {
  onSelect: (coords: Coordinates) => void
  placeholder?: string
}

export function AddressSearch({ onSelect, placeholder = 'Rechercher une adresse de départ...' }: AddressSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<NominatimResult[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
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
          q: query,
          viewbox: NANTES_VIEWBOX,
        })
        const res = await fetch(`${NOMINATIM_BASE}?${params}`, {
          signal: controller.signal,
          headers: { 'Accept-Language': 'fr' },
        })
        const data = (await res.json()) as NominatimResult[]
        setResults(data)
        setOpen(data.length > 0)
        setActiveIndex(-1)
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setResults([])
          setOpen(false)
        }
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  function handleSelect(result: NominatimResult) {
    onSelect({ lat: parseFloat(result.lat), lng: parseFloat(result.lon) })
    setQuery(result.display_name.split(',').slice(0, 2).join(',').trim())
    setOpen(false)
    setResults([])
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open || results.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, -1))
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault()
      handleSelect(results[activeIndex])
    } else if (e.key === 'Escape') {
      setOpen(false)
      setActiveIndex(-1)
      inputRef.current?.blur()
    }
  }

  return (
    <div className="relative">
      <label htmlFor="address-search" className="sr-only">
        Rechercher une adresse de départ
      </label>
      <div className="relative flex items-center">
        <span className="absolute left-3 text-slate-400 pointer-events-none" aria-hidden="true">
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
          id="address-search"
          type="search"
          role="combobox"
          aria-expanded={open}
          aria-controls="address-results"
          aria-autocomplete="list"
          aria-activedescendant={activeIndex >= 0 ? `address-result-${activeIndex}` : undefined}
          value={query}
          onChange={(e) => {
            const val = e.target.value
            setQuery(val)
            if (val.length < 3) {
              setResults([])
              setOpen(false)
            }
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder={placeholder}
          autoComplete="off"
          className="input pl-9 bg-white shadow-card-md"
        />
        {loading && (
          <span className="absolute right-3 pointer-events-none" aria-label="Recherche en cours">
            <div className="w-4 h-4 border-2 border-slate-200 border-t-eco-600 rounded-full animate-spin" />
          </span>
        )}
      </div>

      {open && results.length > 0 && (
        <ul
          id="address-results"
          role="listbox"
          aria-label="Suggestions d'adresses"
          className="absolute top-full left-0 right-0 mt-1 bg-white rounded-card shadow-card-lg border border-slate-100 overflow-hidden z-overlay max-h-64 overflow-y-auto"
        >
          {results.map((result, index) => (
            <li
              key={result.place_id}
              id={`address-result-${index}`}
              role="option"
              aria-selected={index === activeIndex}
              onMouseDown={() => handleSelect(result)}
              title={result.display_name}
              className={`px-4 py-3 cursor-pointer text-body-sm border-b border-slate-50 last:border-0 truncate transition-colors duration-fast ${
                index === activeIndex
                  ? 'bg-eco-50 text-eco-800'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              {result.display_name}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
