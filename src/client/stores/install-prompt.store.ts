import { create } from 'zustand'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

interface InstallPromptState {
  deferredPrompt: BeforeInstallPromptEvent | null
  isInstalled: boolean
  promptInstall: () => Promise<void>
}

function isRunningStandalone() {
  const nav = window.navigator as Navigator & { standalone?: boolean }
  return (
    window.matchMedia?.('(display-mode: standalone)').matches === true || nav.standalone === true
  )
}

export const useInstallPromptStore = create<InstallPromptState>((set, get) => ({
  deferredPrompt: null,
  isInstalled: isRunningStandalone(),
  promptInstall: async () => {
    const { deferredPrompt } = get()
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    await deferredPrompt.userChoice
    // Un refus ne referme pas définitivement la porte : Chromium redéclenche
    // `beforeinstallprompt` juste après la résolution de userChoice (cette instance,
    // elle, est à usage unique) — le listener module-level ci-dessous la recapture
    // et réactive le bouton. Voir le composant appelant pour ne jamais afficher
    // « Déjà installée » tant que `isInstalled` n'est pas vrai.
    set({ deferredPrompt: null })
  },
}))

/** Capturé au chargement du module plutôt que dans un composant : `beforeinstallprompt`
 * ne se déclenche qu'une fois, souvent avant que l'utilisateur n'atteigne une des pages
 * lazy-loaded (Onboarding, Paramètres) qui affichent le bouton d'installation — un
 * listener monté dans leur useEffect rate silencieusement l'événement. Ce module doit
 * être importé depuis main.tsx (bundle principal, non lazy) pour écouter dès le départ. */
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault()
  useInstallPromptStore.setState({ deferredPrompt: e as BeforeInstallPromptEvent })
})

window.addEventListener('appinstalled', () => {
  useInstallPromptStore.setState({ deferredPrompt: null, isInstalled: true })
})
