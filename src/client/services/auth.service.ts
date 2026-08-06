import { apiFetch } from '../utils/api-client'

interface RegisterPayload {
  email: string
  password: string
}

interface LoginPayload {
  email: string
  password: string
}

interface AuthTokenResponse {
  accessToken: string
}

export async function register(payload: RegisterPayload): Promise<AuthTokenResponse> {
  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    credentials: 'include',
  })

  const data: unknown = await res.json()

  if (!res.ok) {
    const err = data as { error?: string }
    throw new Error(err.error ?? "Erreur lors de l'inscription")
  }

  return data as AuthTokenResponse
}

export async function refreshToken(signal?: AbortSignal): Promise<AuthTokenResponse | null> {
  const res = await fetch('/api/auth/refresh', {
    method: 'POST',
    credentials: 'include',
    signal,
  })
  if (!res.ok) return null
  return res.json() as Promise<AuthTokenResponse>
}

export async function logout(): Promise<void> {
  await fetch('/api/auth/logout', {
    method: 'POST',
    credentials: 'include',
  })
}

// authGuard exige un Bearer token (contrairement aux autres endpoints de ce
// fichier, qui ne s'appuient que sur le cookie de refresh) — passe par apiFetch.
export async function deleteAccount(): Promise<void> {
  const res = await apiFetch('/api/auth/me', { method: 'DELETE' })
  if (!res.ok) {
    const data: unknown = await res.json().catch(() => null)
    const err = data as { error?: string } | null
    throw new Error(err?.error ?? 'Impossible de supprimer le compte')
  }
}

// Trace serveur du consentement géolocalisation (accountabilité RGPD) — échec
// non bloquant, le consentement local (Zustand) reste la source de vérité UX.
export async function recordGeolocationConsent(): Promise<void> {
  await apiFetch('/api/auth/consent', { method: 'POST' }).catch(() => {
    /* non bloquant : le consentement local suffit à l'expérience utilisateur */
  })
}

// Droit à la portabilité (RGPD art. 20) — télécharge un export JSON des données
// personnelles du compte connecté.
export async function exportUserData(): Promise<void> {
  const res = await apiFetch('/api/auth/me/export')
  if (!res.ok) {
    throw new Error('Impossible de générer votre export de données')
  }
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'urbanflow-donnees.json'
  link.click()
  URL.revokeObjectURL(url)
}

export async function login(payload: LoginPayload): Promise<AuthTokenResponse> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    credentials: 'include',
  })

  const data: unknown = await res.json()

  if (!res.ok) {
    const err = data as { error?: string }
    throw new Error(err.error ?? 'Identifiants incorrects')
  }

  return data as AuthTokenResponse
}
