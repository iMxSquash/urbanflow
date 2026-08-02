const STORAGE_KEY = 'urbanflow-last-journey'

export interface CachedJourney {
  fromLabel: string
  toLabel: string
  durationMin: number
  co2SavedGrams: number
  savedAt: string
}

/** Dernier itinéraire calculé, mis en cache localement pour rester consultable
 * hors ligne (MAQUETTE.md §5.7 « Disponible hors ligne »). */
export function saveLastJourney(journey: CachedJourney): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(journey))
  } catch {
    /* stockage indisponible (navigation privée...) — non bloquant */
  }
}

export function getLastJourney(): CachedJourney | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as CachedJourney) : null
  } catch {
    return null
  }
}
