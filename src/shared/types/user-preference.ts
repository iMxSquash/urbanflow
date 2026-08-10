export const USER_PREFERENCES = ['eco', 'fast', 'balanced'] as const
export type UserPreference = (typeof USER_PREFERENCES)[number]
