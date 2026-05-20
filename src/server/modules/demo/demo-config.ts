// Runtime overrides — changed without server restart via PATCH /api/demo/mode
let _demoOverride: boolean | null = null
let _weatherOverride: 'sunny' | 'rainy' | null = null

export function isDemoMode(): boolean {
  if (_demoOverride !== null) return _demoOverride
  return process.env.DEMO_MODE === 'true'
}

export function setDemoMode(enabled: boolean): void {
  _demoOverride = enabled
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
