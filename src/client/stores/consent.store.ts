import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type GeolocationConsent = 'granted' | 'denied' | null

interface ConsentState {
  geolocationConsent: GeolocationConsent
  grantGeolocation: () => void
  denyGeolocation: () => void
}

export const useConsentStore = create<ConsentState>()(
  persist(
    (set) => ({
      geolocationConsent: null,
      grantGeolocation: () => set({ geolocationConsent: 'granted' }),
      denyGeolocation: () => set({ geolocationConsent: 'denied' }),
    }),
    { name: 'urbanflow-consent' },
  ),
)
