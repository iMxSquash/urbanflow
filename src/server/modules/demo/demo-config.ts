export const DEMO_WEATHER_MODES = ['sunny', 'rainy'] as const
export type DemoWeather = (typeof DEMO_WEATHER_MODES)[number]

// Runtime overrides — changed without server restart via PATCH /api/demo/mode
let _weatherDemo: boolean | null = null // météo simulée seulement
let _providersDemo: boolean | null = null // trajets + bicloo + tan simulés
let _weatherOverride: DemoWeather | null = null

/** Variable d'env brute, indépendante des overrides runtime — sert uniquement à
 * décider si le panneau de contrôle du mode démo doit être visible dans
 * `ParametresPage.tsx` (déploiement de soutenance vs production normale). */
export function isDemoModeEnvEnabled(): boolean {
  return process.env.DEMO_MODE === 'true'
}

/** Météo simulée : actif si weather demo OU providers demo est activé.
 * `DEMO_MODE` n'influence pas ce défaut — il ne gate que l'affichage du panneau,
 * voir `isDemoModeEnvEnabled()`. */
export function isWeatherDemoMode(): boolean {
  if (_providersDemo) return true
  return _weatherDemo ?? false
}

/** Providers simulés (DemoProvider, Bicloo, TAN fixtures).
 * `DEMO_MODE` n'influence pas ce défaut — il ne gate que l'affichage du panneau,
 * voir `isDemoModeEnvEnabled()`. */
export function isDemoMode(): boolean {
  return _providersDemo ?? false
}

export function setWeatherDemoMode(enabled: boolean): void {
  _weatherDemo = enabled
}

export function setProvidersDemo(enabled: boolean): void {
  _providersDemo = enabled
}

export function getDemoWeather(): DemoWeather {
  if (_weatherOverride) return _weatherOverride
  if (process.env.DEMO_WEATHER === 'rainy') return 'rainy'
  if (process.env.DEMO_WEATHER === 'sunny') return 'sunny'
  const month = new Date().getMonth()
  return month >= 9 || month <= 2 ? 'rainy' : 'sunny'
}

export function setDemoWeather(w: DemoWeather | null): void {
  _weatherOverride = w
}
