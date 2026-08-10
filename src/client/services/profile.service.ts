import { apiFetch, parseJsonResponse } from '../utils/api-client'
import type { MobilityProfile, UpdateProfileInput } from '@shared/types/index'

export async function getProfile(): Promise<MobilityProfile> {
  const res = await apiFetch('/api/profile')
  return parseJsonResponse<MobilityProfile>(res, 'Erreur lors du chargement du profil')
}

export async function putProfile(input: UpdateProfileInput): Promise<MobilityProfile> {
  const res = await apiFetch('/api/profile', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  return parseJsonResponse<MobilityProfile>(res, 'Erreur lors de la mise à jour du profil')
}
