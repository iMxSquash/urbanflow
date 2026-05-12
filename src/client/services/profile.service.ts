import { apiFetch } from '../utils/api-client'
import type { MobilityProfile, UpdateProfileInput } from '@shared/types/index'

export async function getProfile(): Promise<MobilityProfile> {
  const res = await apiFetch('/api/profile')
  const data: unknown = await res.json()

  if (!res.ok) {
    const err = data as { error?: string }
    throw new Error(err.error ?? 'Erreur lors du chargement du profil')
  }

  return data as MobilityProfile
}

export async function putProfile(input: UpdateProfileInput): Promise<MobilityProfile> {
  const res = await apiFetch('/api/profile', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  const data: unknown = await res.json()

  if (!res.ok) {
    const err = data as { error?: string }
    throw new Error(err.error ?? 'Erreur lors de la mise à jour du profil')
  }

  return data as MobilityProfile
}
