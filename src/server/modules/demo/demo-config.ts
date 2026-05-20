// Runtime overrides — changed without server restart via PATCH /api/demo/mode
let _weatherDemo: boolean | null = null   // météo simulée seulement
let _providersDemo: boolean | null = null // trajets + bicloo + tan simulés
let _weatherOverride: 'sunny' | 'rainy' | null = null

/** Météo simulée : actif si weather demo OU providers demo est activé */
export function isWeatherDemoMode(): boolean {
  if (_providersDemo) return true
  if (_weatherDemo !== null) return _weatherDemo
  return process.env.DEMO_MODE === 'true'
}

/** Providers simulés (DemoProvider, Bicloo, TAN fixtures) */
export function isDemoMode(): boolean {
  if (_providersDemo !== null) return _providersDemo
  return process.env.DEMO_MODE === 'true'
}

export function setWeatherDemoMode(enabled: boolean): void {
  _weatherDemo = enabled
}

export function setProvidersDemo(enabled: boolean): void {
  _providersDemo = enabled
}

export function getDemoWeather(): 'sunny' | 'rainy' {
  if (_weatherOverride) return _weatherOverride
  if (process.env.DEMO_WEATHER === 'rainy') return 'rainy'
  if (process.env.DEMO_WEATHER === 'sunny') return 'sunny'
  const month = new Date().getMonth()
  return month >= 9 || month <= 2 ? 'rainy' : 'sunny'
}

export function setDemoWeather(w: 'sunny' | 'rainy' | null): void {
  _weatherOverride = w
}
