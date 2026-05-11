import { create } from 'zustand'

interface AuthUser {
  id: string
  email: string
}

interface AuthState {
  accessToken: string | null
  user: AuthUser | null
  isInitialized: boolean
  setAuth: (token: string) => void
  clearAuth: () => void
  setInitialized: () => void
}

function parseJwtPayload(token: string): AuthUser | null {
  try {
    const raw = token.split('.')[1]
    const decoded: unknown = JSON.parse(atob(raw.replace(/-/g, '+').replace(/_/g, '/')))
    if (
      decoded !== null &&
      typeof decoded === 'object' &&
      'sub' in decoded &&
      'email' in decoded &&
      typeof (decoded as Record<string, unknown>).sub === 'string' &&
      typeof (decoded as Record<string, unknown>).email === 'string'
    ) {
      return {
        id: (decoded as { sub: string }).sub,
        email: (decoded as { email: string }).email,
      }
    }
    return null
  } catch {
    return null
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  isInitialized: false,
  setAuth: (token) => set({ accessToken: token, user: parseJwtPayload(token) }),
  clearAuth: () => set({ accessToken: null, user: null }),
  setInitialized: () => set({ isInitialized: true }),
}))
