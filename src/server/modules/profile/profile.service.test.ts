import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TRANSPORT_MODES, USER_PREFERENCES } from '../../../shared/types/index.js'
import type { TransportMode, UserPreference } from '../../../shared/types/index.js'

vi.mock('../../db/pool.js', () => ({
  pool: { query: vi.fn() },
}))

import { pool } from '../../db/pool.js'
import { getProfile, upsertProfile } from './profile.service.js'

const mockQuery = pool.query as ReturnType<typeof vi.fn>

const USER_ID = 'aaaaaaaa-0000-0000-0000-000000000001'

const BASE_ROW = {
  user_id: USER_ID,
  preferred_modes: ['walk', 'tramway', 'bus'],
  max_walk_minutes: 15,
  preference: 'balanced',
  pmr_accessibility: false,
  updated_at: new Date('2026-05-12T10:00:00.000Z'),
}

beforeEach(() => {
  vi.clearAllMocks()
})

// ─── getProfile ───────────────────────────────────────────────────────────────

describe('getProfile', () => {
  it('retourne le profil mappé si une ligne existe en base', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [BASE_ROW] })

    const result = await getProfile(USER_ID)

    expect(result.userId).toBe(USER_ID)
    expect(result.preferredModes).toEqual(['walk', 'tramway', 'bus'])
    expect(result.maxWalkMinutes).toBe(15)
    expect(result.preference).toBe('balanced')
    expect(result.pmrAccessibility).toBe(false)
    expect(result.updatedAt).toBe('2026-05-12T10:00:00.000Z')
  })

  it('retourne les valeurs par défaut si aucun profil en base', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] })

    const result = await getProfile(USER_ID)

    expect(result.userId).toBe(USER_ID)
    expect(result.preferredModes).toEqual(['walk', 'tramway', 'bus'])
    expect(result.maxWalkMinutes).toBe(15)
    expect(result.preference).toBe('balanced')
    expect(result.pmrAccessibility).toBe(false)
  })

  it('convertit updated_at string (comportement pg sans type parser) en ISO string', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ ...BASE_ROW, updated_at: '2026-05-12T10:00:00.000Z' }],
    })

    const result = await getProfile(USER_ID)

    expect(result.updatedAt).toBe('2026-05-12T10:00:00.000Z')
  })

  it('passe le userId en paramètre de la requête SQL', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] })

    await getProfile(USER_ID)

    expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('WHERE user_id = $1'), [USER_ID])
  })

  it('filtre les modes inconnus et conserve les valides', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ ...BASE_ROW, preferred_modes: ['walk', 'avion', 'scooter'] }],
    })

    const result = await getProfile(USER_ID)

    expect(result.preferredModes).toEqual(['walk', 'scooter'])
  })

  it('applique le fallback modes si tous les modes sont inconnus', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ ...BASE_ROW, preferred_modes: ['avion', 'taxi'] }],
    })

    const result = await getProfile(USER_ID)

    expect(result.preferredModes).toEqual(['walk', 'tramway', 'bus'])
  })

  it('applique le fallback modes si preferred_modes est vide (défaut DB {})', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ ...BASE_ROW, preferred_modes: [] }],
    })

    const result = await getProfile(USER_ID)

    expect(result.preferredModes).toEqual(['walk', 'tramway', 'bus'])
  })

  it('normalise une preference inconnue vers balanced', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ ...BASE_ROW, preference: 'turbo' }],
    })

    const result = await getProfile(USER_ID)

    expect(result.preference).toBe('balanced')
  })

  it('accepte toutes les valeurs de preference valides', async () => {
    const prefs = USER_PREFERENCES

    for (const pref of prefs) {
      mockQuery.mockResolvedValueOnce({ rows: [{ ...BASE_ROW, preference: pref }] })
      const result = await getProfile(USER_ID)
      expect(result.preference).toBe(pref)
    }
  })

  it('accepte tous les modes valides sans filtrage', async () => {
    const allModes = TRANSPORT_MODES
    mockQuery.mockResolvedValueOnce({
      rows: [{ ...BASE_ROW, preferred_modes: allModes }],
    })

    const result = await getProfile(USER_ID)

    expect(result.preferredModes).toEqual(allModes)
  })

  it('conserve navibus et train comme modes valides', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ ...BASE_ROW, preferred_modes: ['navibus', 'train', 'avion'] }],
    })

    const result = await getProfile(USER_ID)

    expect(result.preferredModes).toEqual(['navibus', 'train'])
  })
})

// ─── upsertProfile ────────────────────────────────────────────────────────────

describe('upsertProfile', () => {
  const INPUT = {
    preferredModes: ['walk', 'bike'] as TransportMode[],
    maxWalkMinutes: 20,
    preference: 'eco' as UserPreference,
    pmrAccessibility: true,
  }

  const RETURNED_ROW = {
    user_id: USER_ID,
    preferred_modes: ['walk', 'bike'],
    max_walk_minutes: 20,
    preference: 'eco',
    pmr_accessibility: true,
    updated_at: new Date('2026-05-12T12:00:00.000Z'),
  }

  it('retourne le profil mappé depuis le RETURNING', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [RETURNED_ROW] })

    const result = await upsertProfile(USER_ID, INPUT)

    expect(result.userId).toBe(USER_ID)
    expect(result.preferredModes).toEqual(['walk', 'bike'])
    expect(result.maxWalkMinutes).toBe(20)
    expect(result.preference).toBe('eco')
    expect(result.pmrAccessibility).toBe(true)
    expect(result.updatedAt).toBe('2026-05-12T12:00:00.000Z')
  })

  it('transmet les bons paramètres SQL ($1…$5)', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [RETURNED_ROW] })

    await upsertProfile(USER_ID, INPUT)

    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO mobility_profiles'),
      [
        USER_ID,
        INPUT.preferredModes,
        INPUT.maxWalkMinutes,
        INPUT.preference,
        INPUT.pmrAccessibility,
      ]
    )
  })

  it('utilise ON CONFLICT … DO UPDATE (upsert)', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [RETURNED_ROW] })

    await upsertProfile(USER_ID, INPUT)

    const [sql] = mockQuery.mock.calls[0] as [string]
    expect(sql).toMatch(/ON CONFLICT/i)
    expect(sql).toMatch(/DO UPDATE/i)
  })

  it('inclut RETURNING pour récupérer la ligne persistée', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [RETURNED_ROW] })

    await upsertProfile(USER_ID, INPUT)

    const [sql] = mockQuery.mock.calls[0] as [string]
    expect(sql).toMatch(/RETURNING/i)
  })
})
