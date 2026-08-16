import type { TransportMode } from '@shared/types/index'

const DB_NAME = 'urbanflow-last-journey'
const STORE_NAME = 'journey'
const RECORD_KEY = 'last'

/** Résumé d'un segment, sans coordonnées — même esprit que la règle RGPD
 * CLAUDE.md sur la table `trips` ("aucune coordonnée GPS précise stockée
 * au-delà du calcul d'itinéraire") : rien n'exige de tracé ici, l'affichage
 * hors ligne (`LastJourneyModal`) reste une liste textuelle, pas une carte. */
export interface CachedJourneyStep {
  mode: TransportMode
  distanceKm: number
  durationMin: number
  lineName?: string
  /** Nom lisible du point de départ/arrivée du segment (arrêt, station
   * Bicloo...) — un nom de lieu, jamais des coordonnées ; absent si le
   * provider ne l'a pas résolu (ex. un unique segment marche, où c'est le
   * `fromLabel`/`toLabel` du trajet entier qui fait office de nom). */
  fromName?: string
  toName?: string
}

export interface CachedJourney {
  fromLabel: string
  toLabel: string
  durationMin: number
  co2SavedGrams: number
  savedAt: string
  /** Optionnel : absent sur un enregistrement mis en cache avant l'ajout de
   * ce champ — `getLastJourney` ne doit pas planter sur une entrée existante
   * sans `steps`. */
  steps?: CachedJourneyStep[]
}

// Ouverture à la demande plutôt qu'une connexion module-level tenue en
// permanence : un seul enregistrement, lu/écrit rarement (fin de recherche,
// affichage hors ligne) — pas besoin de payer le coût de garder la base
// ouverte entre deux appels.
function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB indisponible'))
      return
    }
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
    request.onblocked = () => reject(new Error('IndexedDB bloqué'))
  })
}

/** Dernier itinéraire calculé, mis en cache localement (IndexedDB) pour rester
 * consultable hors ligne (MAQUETTE.md §5.7 « Disponible hors ligne »). Toute
 * indisponibilité (navigation privée, quota, absence de support, base
 * bloquée) dégrade silencieusement — jamais d'exception propagée à
 * l'appelant. */
export async function saveLastJourney(journey: CachedJourney): Promise<void> {
  try {
    const db = await openDb()
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      tx.objectStore(STORE_NAME).put(journey, RECORD_KEY)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
    db.close()
  } catch {
    /* stockage indisponible (navigation privée...) — non bloquant */
  }
}

export async function getLastJourney(): Promise<CachedJourney | null> {
  try {
    const db = await openDb()
    const journey = await new Promise<CachedJourney | null>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const request = tx.objectStore(STORE_NAME).get(RECORD_KEY)
      request.onsuccess = () => resolve((request.result as CachedJourney | undefined) ?? null)
      request.onerror = () => reject(request.error)
    })
    db.close()
    return journey
  } catch {
    return null
  }
}
