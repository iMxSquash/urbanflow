import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../db/pool.js', () => ({
  pool: { query: vi.fn() },
}))

import { pool } from '../db/pool.js'
import { purgeOldTrips } from './purge-old-trips.job.js'

const mockQuery = pool.query as ReturnType<typeof vi.fn>

beforeEach(() => {
  vi.clearAllMocks()
})

describe('purgeOldTrips', () => {
  it('supprime les trajets et récompenses de plus de 12 mois', async () => {
    mockQuery.mockResolvedValueOnce({ rowCount: 3 }).mockResolvedValueOnce({ rowCount: 1 })

    const result = await purgeOldTrips()

    expect(result).toEqual({ trips: 3, redemptions: 1 })
    expect(String(mockQuery.mock.calls[0][0])).toContain('DELETE FROM trips')
    expect(String(mockQuery.mock.calls[0][0])).toContain("interval '12 months'")
    expect(String(mockQuery.mock.calls[1][0])).toContain('DELETE FROM reward_redemptions')
  })

  it("retourne 0 si aucune ligne n'est purgée", async () => {
    mockQuery.mockResolvedValueOnce({ rowCount: 0 }).mockResolvedValueOnce({ rowCount: 0 })

    const result = await purgeOldTrips()

    expect(result).toEqual({ trips: 0, redemptions: 0 })
  })

  it('gère rowCount null (driver pg)', async () => {
    mockQuery.mockResolvedValueOnce({ rowCount: null }).mockResolvedValueOnce({ rowCount: null })

    const result = await purgeOldTrips()

    expect(result).toEqual({ trips: 0, redemptions: 0 })
  })
})
