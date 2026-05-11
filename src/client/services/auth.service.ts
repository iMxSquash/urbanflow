interface RegisterPayload {
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

export async function login(payload: RegisterPayload): Promise<AuthTokenResponse> {
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
