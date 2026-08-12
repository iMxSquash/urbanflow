import { apiFetch, parseJsonResponse } from '../utils/api-client'

interface RegisterPayload {
  email: string
  password: string
  termsAccepted: boolean
}

interface LoginPayload {
  email: string
  password: string
  rememberMe?: boolean
}

interface AuthTokenResponse {
  accessToken: string
}

interface RegisterResponse extends AuthTokenResponse {
  recoveryCodes: string[]
}

export async function register(payload: RegisterPayload): Promise<RegisterResponse> {
  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    credentials: 'include',
  })

  return parseJsonResponse<RegisterResponse>(res, "Erreur lors de l'inscription")
}

interface RecoverPasswordPayload {
  email: string
  recoveryCode: string
  newPassword: string
}

interface RecoverPasswordResponse {
  replacementCode: string
}

// Pas d'envoi d'email — réinitialisation via un code de récupération sauvegardé
// (cf. docs/recherche-mot-de-passe-oublie.md). Ne connecte pas automatiquement.
export async function recoverPassword(
  payload: RecoverPasswordPayload
): Promise<RecoverPasswordResponse> {
  const res = await fetch('/api/auth/password/recover', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    credentials: 'include',
  })

  return parseJsonResponse<RecoverPasswordResponse>(res, 'Code de récupération invalide')
}

interface RegenerateRecoveryCodesResponse {
  recoveryCodes: string[]
}

export async function regenerateRecoveryCodes(): Promise<RegenerateRecoveryCodesResponse> {
  const res = await apiFetch('/api/auth/recovery-codes/regenerate', { method: 'POST' })
  return parseJsonResponse<RegenerateRecoveryCodesResponse>(
    res,
    'Impossible de régénérer les codes de récupération'
  )
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
  await parseJsonResponse(res, 'Impossible de supprimer le compte')
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

  return parseJsonResponse<AuthTokenResponse>(res, 'Identifiants incorrects')
}
