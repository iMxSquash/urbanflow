import type { Coordinates } from '@shared/types/index'

const STORAGE_KEY = 'urbanflow-recent-searches'
const MAX_RECENTS = 5

export interface RecentSearch extends Coordinates {
  label: string
  savedAt: string
}

/** Recherches d'adresse récentes — MAQUETTE.md §5.2 état 2 "Récents". Persisté
 * en local (aucun endpoint serveur pour ça, même principe que
 * `last-journey-cache.ts`), dédupliqué par libellé, les plus récentes en tête. */
export function getRecentSearches(): RecentSearch[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as RecentSearch[]) : []
  } catch {
    return []
  }
}

export function addRecentSearch(entry: { label: string } & Coordinates): void {
  try {
    const withoutDuplicate = getRecentSearches().filter((r) => r.label !== entry.label)
    const next = [{ ...entry, savedAt: new Date().toISOString() }, ...withoutDuplicate].slice(
      0,
      MAX_RECENTS
    )
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    /* stockage indisponible (navigation privée...) — non bloquant */
  }
}

const WEEKDAYS_FR = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.']

/** "auj." / "hier" / jour de la semaine abrégé / date courte — MAQUETTE.md
 * état 2 ("hier", "lun."). */
export function formatRecentTimestamp(iso: string): string {
  const saved = new Date(iso)
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  const diffDays = Math.round((startOfDay(new Date()) - startOfDay(saved)) / 86_400_000)

  if (diffDays <= 0) return 'auj.'
  if (diffDays === 1) return 'hier'
  if (diffDays < 7) return WEEKDAYS_FR[saved.getDay()]
  return saved.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
}
