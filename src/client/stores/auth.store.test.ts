import { beforeEach, describe, expect, it, vi } from 'vitest'

const STORAGE_KEY = 'urbanflow-auth'

// zustand persist lit `window.localStorage` (pas le `localStorage` global de
// Node, non fonctionnel sans `--localstorage-file`) — on stub `window` avec un
// Storage en mémoire, comme `install-prompt.store.test.ts` le fait déjà.
function stubWindow() {
  const store = new Map<string, string>()
  const fakeStorage: Storage = {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => {
      store.set(key, value)
    },
    removeItem: (key) => {
      store.delete(key)
    },
    clear: () => store.clear(),
    key: (index) => Array.from(store.keys())[index] ?? null,
    get length() {
      return store.size
    },
  }
  Object.defineProperty(globalThis, 'window', {
    value: { localStorage: fakeStorage },
    writable: true,
    configurable: true,
  })
  return fakeStorage
}

describe('auth store — persistance localStorage', () => {
  let localStorage: Storage

  beforeEach(() => {
    vi.resetModules()
    localStorage = stubWindow()
  })

  // Garde-fou pour le point fragile signalé en revue : `partialize` est la
  // seule barrière empêchant un token de finir dans localStorage (cf. CLAUDE.md
  // — cookie HttpOnly uniquement). Ce test échoue si un futur ajout à
  // `partialize` élargit la persistance au-delà de `isGuest`.
  it('ne persiste que isGuest après une connexion réelle, jamais le token ni le user', async () => {
    const { useAuthStore } = await import('./auth.store')

    useAuthStore.getState().setAuth('fake.jwt.token')

    const persisted = JSON.parse(localStorage.getItem(STORAGE_KEY)!)
    expect(Object.keys(persisted.state)).toEqual(['isGuest'])
    expect(persisted.state.isGuest).toBe(false)
  })

  it('ne persiste que isGuest en mode invité', async () => {
    const { useAuthStore } = await import('./auth.store')

    useAuthStore.getState().continueAsGuest()

    const persisted = JSON.parse(localStorage.getItem(STORAGE_KEY)!)
    expect(Object.keys(persisted.state)).toEqual(['isGuest'])
    expect(persisted.state.isGuest).toBe(true)
  })
})
