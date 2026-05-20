import { apiFetch } from '../utils/api-client'

export interface DemoStatus {
  demoMode: boolean
  providersDemo: boolean
  weather: 'sunny' | 'rainy'
}

export async function getDemoStatus(): Promise<DemoStatus> {
  const res = await apiFetch('/api/demo/mode')
  if (!res.ok) throw new Error('Demo status indisponible')
  return res.json() as Promise<DemoStatus>
}

export async function patchDemoMode(enabled: boolean): Promise<DemoStatus> {
  const res = await apiFetch('/api/demo/mode', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ enabled }),
  })
  if (!res.ok) throw new Error('Impossible de changer le mode démo')
  return res.json() as Promise<DemoStatus>
}

export async function patchDemoWeather(weather: 'sunny' | 'rainy'): Promise<DemoStatus> {
  const res = await apiFetch('/api/demo/mode', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ weather }),
  })
  if (!res.ok) throw new Error('Impossible de changer la météo démo')
  return res.json() as Promise<DemoStatus>
}

export async function patchProvidersDemo(enabled: boolean): Promise<DemoStatus> {
  const res = await apiFetch('/api/demo/mode', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ providersDemo: enabled }),
  })
  if (!res.ok) throw new Error('Impossible de changer le mode providers démo')
  return res.json() as Promise<DemoStatus>
}
