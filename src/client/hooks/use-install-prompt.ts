import { useInstallPromptStore } from '../stores/install-prompt.store'

/** Expose l'état d'installabilité PWA capturé par `install-prompt.store` — voir
 * ce store pour pourquoi la capture ne peut pas vivre dans ce hook. */
export function useInstallPrompt() {
  const deferredPrompt = useInstallPromptStore((s) => s.deferredPrompt)
  const isInstalled = useInstallPromptStore((s) => s.isInstalled)
  const promptInstall = useInstallPromptStore((s) => s.promptInstall)

  return { canInstall: !!deferredPrompt, isInstalled, promptInstall }
}
