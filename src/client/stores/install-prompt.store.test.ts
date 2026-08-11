import { beforeEach, describe, expect, it, vi } from 'vitest'

function stubWindow(standalone = false) {
  const fakeWindow = Object.assign(new EventTarget(), {
    matchMedia: vi.fn().mockReturnValue({ matches: standalone }),
    navigator: {},
  })
  Object.defineProperty(globalThis, 'window', {
    value: fakeWindow,
    writable: true,
    configurable: true,
  })
}

function fakeInstallEvent(outcome: 'accepted' | 'dismissed' = 'accepted') {
  return Object.assign(new Event('beforeinstallprompt'), {
    prompt: vi.fn().mockResolvedValue(undefined),
    userChoice: Promise.resolve({ outcome }),
  })
}

describe('install-prompt store', () => {
  beforeEach(() => {
    vi.resetModules()
    stubWindow()
  })

  it('captures beforeinstallprompt fired long before any page reads the store', async () => {
    const { useInstallPromptStore } = await import('./install-prompt.store')

    // Simule le cas réel : l'utilisateur reste sur MapPage (chunk séparé) pendant
    // un moment avant de naviguer vers Paramètres — l'event arrive alors que
    // personne n'a encore "consommé" le store.
    window.dispatchEvent(fakeInstallEvent())

    // Le composant Paramètres ne se monte que plus tard (lazy-loaded) : il lit
    // simplement l'état courant du store, comme le ferait le hook.
    expect(useInstallPromptStore.getState().deferredPrompt).not.toBeNull()
  })

  it('resets deferredPrompt after a successful install, without claiming it is installed yet', async () => {
    const { useInstallPromptStore } = await import('./install-prompt.store')
    const event = fakeInstallEvent('accepted')
    window.dispatchEvent(event)

    await useInstallPromptStore.getState().promptInstall()

    expect(event.prompt).toHaveBeenCalledOnce()
    expect(useInstallPromptStore.getState().deferredPrompt).toBeNull()
    // isInstalled ne doit devenir vrai que via l'event `appinstalled` du navigateur,
    // pas par supposition dès que l'utilisateur a accepté la boîte de dialogue.
    expect(useInstallPromptStore.getState().isInstalled).toBe(false)
  })

  it('dismissing the prompt does not mark the app as installed, and a re-fired event re-enables install', async () => {
    const { useInstallPromptStore } = await import('./install-prompt.store')
    const event = fakeInstallEvent('dismissed')
    window.dispatchEvent(event)

    await useInstallPromptStore.getState().promptInstall()

    // Cas 4 : fermer la boîte de dialogue ne doit ni prétendre "déjà installée"
    // ni bloquer toute nouvelle tentative.
    expect(useInstallPromptStore.getState().isInstalled).toBe(false)
    expect(useInstallPromptStore.getState().deferredPrompt).toBeNull()

    // Chromium redéclenche `beforeinstallprompt` juste après la résolution de
    // userChoice — le listener module-level doit le recapturer.
    window.dispatchEvent(fakeInstallEvent())
    expect(useInstallPromptStore.getState().deferredPrompt).not.toBeNull()
  })

  it('marks the app as installed on the appinstalled event and clears any pending prompt', async () => {
    const { useInstallPromptStore } = await import('./install-prompt.store')
    window.dispatchEvent(fakeInstallEvent())

    window.dispatchEvent(new Event('appinstalled'))

    expect(useInstallPromptStore.getState().isInstalled).toBe(true)
    expect(useInstallPromptStore.getState().deferredPrompt).toBeNull()
  })

  it('reads isInstalled from standalone display-mode at store creation', async () => {
    stubWindow(true)
    const { useInstallPromptStore } = await import('./install-prompt.store')

    expect(useInstallPromptStore.getState().isInstalled).toBe(true)
  })

  it('promptInstall is a no-op when no prompt was ever captured', async () => {
    const { useInstallPromptStore } = await import('./install-prompt.store')

    await expect(useInstallPromptStore.getState().promptInstall()).resolves.toBeUndefined()
  })
})
