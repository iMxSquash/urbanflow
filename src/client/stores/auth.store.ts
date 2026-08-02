import { create } from 'zustand'
import { refreshToken } from '../services/auth.service'

interface AuthUser {
  id: string
  email: string
}

interface AuthState {
  accessToken: string | null
  user: AuthUser | null
  isInitialized: boolean
  isGuest: boolean
  setAuth: (token: string) => void
  clearAuth: () => void
  setInitialized: () => void
  refreshIfNeeded: () => Promise<string | null>
  continueAsGuest: () => void
}

function parseJwtPayload(token: string): AuthUser | null {
  try {
    const raw = token.split('.')[1]
    const base64 = raw.replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
    const decoded: unknown = JSON.parse(atob(padded))
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

export const useAuthStore = create<AuthState>((set) => {
  let pendingRefresh: Promise<string | null> | null = null

  return {
    accessToken: null,
    user: null,
    isInitialized: false,
    isGuest: false,

    setAuth: (token) => set({ accessToken: token, user: parseJwtPayload(token), isGuest: false }),
    clearAuth: () => set({ accessToken: null, user: null, isGuest: false }),
    setInitialized: () => set({ isInitialized: true }),
    continueAsGuest: () => set({ isGuest: true, isInitialized: true }),

    refreshIfNeeded: () => {
      if (!pendingRefresh) {
        pendingRefresh = refreshToken()
          .then((data) => {
            const token = data?.accessToken ?? null
            if (token) set({ accessToken: token, user: parseJwtPayload(token) })
            return token
          })
          .finally(() => {
            pendingRefresh = null
          })
      }
      return pendingRefresh
    },
  }
})
