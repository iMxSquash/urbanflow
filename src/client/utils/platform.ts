/** Détecte iOS/iPadOS pour adapter le flux d'installation PWA : `beforeinstallprompt`
 * n'existe pas sous WebKit (tout navigateur iOS, Chrome inclus, est un wrapper WebKit —
 * politique imposée par Apple), donc aucun bouton ne peut jamais le déclencher là-bas ;
 * l'installation n'est possible que via Partager → Sur l'écran d'accueil. iPadOS 13+
 * usurpe le user-agent macOS, on le distingue par le support tactile (absent d'un vrai
 * Mac). */
export function isIosDevice(): boolean {
  const ua = window.navigator.userAgent
  if (/iPad|iPhone|iPod/.test(ua)) return true
  return window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1
}
