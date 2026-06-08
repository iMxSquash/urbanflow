import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../db/pool.js', () => ({
  pool: { query: vi.fn(), connect: vi.fn() },
}))

import { pool } from '../../db/pool.js'
import { RewardError, getCatalog, getUserRedemptions, purchaseReward } from './rewards.service.js'

const mockPoolQuery = pool.query as ReturnType<typeof vi.fn>
const mockConnect = pool.connect as ReturnType<typeof vi.fn>
const mockClient = { query: vi.fn(), release: vi.fn() }

const USER_ID = 'aaaaaaaa-0000-0000-0000-000000000001'
const REWARD_ID = 'bbbbbbbb-0000-0000-0000-000000000001'
const REDEMPTION_ID = 'cccccccc-0000-0000-0000-000000000001'

beforeEach(() => {
  vi.clearAllMocks()
  mockConnect.mockResolvedValue(mockClient)
})

// ── getCatalog ────────────────────────────────────────────────────────────────

describe('getCatalog', () => {
  const REWARD_ROW = {
    id: REWARD_ID,
    name: 'Billet Château des Ducs de Bretagne',
    description: 'Une entrée pour le château',
    reward_type: 'museum_ticket',
    points_cost: 900,
    partner_name: 'Château des Ducs de Bretagne',
  }

  it('retourne le catalogue avec affordable=true si le solde couvre le coût', async () => {
    mockPoolQuery
      .mockResolvedValueOnce({ rows: [REWARD_ROW] })
      .mockResolvedValueOnce({ rows: [{ total_points: 1000 }] })

    const catalog = await getCatalog(USER_ID)

    expect(catalog.totalPoints).toBe(1000)
    expect(catalog.rewards).toHaveLength(1)
    expect(catalog.rewards[0]).toMatchObject({
      id: REWARD_ID,
      name: 'Billet Château des Ducs de Bretagne',
      rewardType: 'museum_ticket',
      pointsCost: 900,
      partnerName: 'Château des Ducs de Bretagne',
      affordable: true,
    })
  })

  it('retourne affordable=false si le solde est insuffisant', async () => {
    mockPoolQuery
      .mockResolvedValueOnce({ rows: [REWARD_ROW] })
      .mockResolvedValueOnce({ rows: [{ total_points: 100 }] })

    const catalog = await getCatalog(USER_ID)

    expect(catalog.rewards[0].affordable).toBe(false)
  })

  it("utilise 0 comme solde si l'utilisateur est introuvable", async () => {
    mockPoolQuery.mockResolvedValueOnce({ rows: [REWARD_ROW] }).mockResolvedValueOnce({ rows: [] })

    const catalog = await getCatalog(USER_ID)

    expect(catalog.totalPoints).toBe(0)
    expect(catalog.rewards[0].affordable).toBe(false)
  })

  it('retourne une liste vide si aucune récompense active', async () => {
    mockPoolQuery
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ total_points: 500 }] })

    const catalog = await getCatalog(USER_ID)

    expect(catalog.rewards).toEqual([])
  })
})

// ── getUserRedemptions ────────────────────────────────────────────────────────

describe('getUserRedemptions', () => {
  const REDEMPTION_ROW = {
    id: REDEMPTION_ID,
    reward_id: REWARD_ID,
    reward_name: 'Bicloo — 1 heure offerte',
    reward_type: 'discount_code',
    partner_name: 'Bicloo / Nantes Métropole',
    code: 'RDM-A1B2C3D4',
    points_spent: 120,
    redeemed_at: '2026-05-20T10:00:00.000Z',
  }

  it('mappe correctement les champs depuis la jointure', async () => {
    mockPoolQuery.mockResolvedValueOnce({ rows: [REDEMPTION_ROW] })

    const redemptions = await getUserRedemptions(USER_ID)

    expect(redemptions).toHaveLength(1)
    expect(redemptions[0]).toMatchObject({
      id: REDEMPTION_ID,
      rewardId: REWARD_ID,
      rewardName: 'Bicloo — 1 heure offerte',
      rewardType: 'discount_code',
      partnerName: 'Bicloo / Nantes Métropole',
      code: 'RDM-A1B2C3D4',
      pointsSpent: 120,
      redeemedAt: '2026-05-20T10:00:00.000Z',
    })
  })

  it('retourne une liste vide si aucun échange', async () => {
    mockPoolQuery.mockResolvedValueOnce({ rows: [] })

    const redemptions = await getUserRedemptions(USER_ID)

    expect(redemptions).toEqual([])
  })
})

// ── purchaseReward ────────────────────────────────────────────────────────────

describe('purchaseReward', () => {
  function setupClientSequence(...responses: Array<{ rows: unknown[] } | Error>) {
    let i = 0
    mockClient.query.mockImplementation(() => {
      const response = responses[i++] ?? { rows: [] }
      return response instanceof Error ? Promise.reject(response) : Promise.resolve(response)
    })
  }

  it("débite les points, génère un code et enregistre l'échange", async () => {
    setupClientSequence(
      { rows: [] }, // BEGIN
      { rows: [{ points_cost: 120, active: true }] }, // SELECT reward
      { rows: [{ total_points: 380 }] }, // UPDATE users RETURNING
      { rows: [] }, // SAVEPOINT redemption_code
      { rows: [{ id: REDEMPTION_ID }] }, // INSERT reward_redemptions RETURNING
      { rows: [] } // COMMIT
    )

    const result = await purchaseReward(USER_ID, REWARD_ID)

    expect(result.redemptionId).toBe(REDEMPTION_ID)
    expect(result.pointsSpent).toBe(120)
    expect(result.totalPoints).toBe(380)
    expect(result.code).toMatch(/^RDM-[A-F0-9]{8}$/)
  })

  it('ouvre la transaction avec BEGIN et la valide avec COMMIT', async () => {
    setupClientSequence(
      { rows: [] },
      { rows: [{ points_cost: 120, active: true }] },
      { rows: [{ total_points: 380 }] },
      { rows: [] },
      { rows: [{ id: REDEMPTION_ID }] },
      { rows: [] }
    )

    await purchaseReward(USER_ID, REWARD_ID)

    const sqls = mockClient.query.mock.calls.map((call) => String(call[0]).trim())
    expect(sqls[0]).toBe('BEGIN')
    expect(sqls[sqls.length - 1]).toBe('COMMIT')
  })

  it('libère le client dans tous les cas (finally)', async () => {
    setupClientSequence(
      { rows: [] },
      { rows: [{ points_cost: 120, active: true }] },
      { rows: [{ total_points: 380 }] },
      { rows: [] },
      { rows: [{ id: REDEMPTION_ID }] },
      { rows: [] }
    )

    await purchaseReward(USER_ID, REWARD_ID)

    expect(mockClient.release).toHaveBeenCalledOnce()
  })

  it("rejette avec NOT_FOUND et rollback si la récompense n'existe pas", async () => {
    setupClientSequence(
      { rows: [] }, // BEGIN
      { rows: [] }, // SELECT reward → aucune ligne
      { rows: [] } // ROLLBACK
    )

    const error = await purchaseReward(USER_ID, REWARD_ID).catch((e: unknown) => e)

    expect(error).toBeInstanceOf(RewardError)
    expect((error as RewardError).code).toBe('NOT_FOUND')
    const sqls = mockClient.query.mock.calls.map((call) => String(call[0]).trim())
    expect(sqls).toContain('ROLLBACK')
    expect(mockClient.release).toHaveBeenCalledOnce()
  })

  it('rejette avec INACTIVE si la récompense est désactivée', async () => {
    setupClientSequence(
      { rows: [] },
      { rows: [{ points_cost: 120, active: false }] },
      { rows: [] } // ROLLBACK
    )

    const error = await purchaseReward(USER_ID, REWARD_ID).catch((e: unknown) => e)

    expect(error).toBeInstanceOf(RewardError)
    expect((error as RewardError).code).toBe('INACTIVE')
  })

  it('rejette avec INSUFFICIENT_POINTS si le solde est trop faible (UPDATE conditionnel → 0 ligne, mais utilisateur existant)', async () => {
    setupClientSequence(
      { rows: [] }, // BEGIN
      { rows: [{ points_cost: 900, active: true }] }, // SELECT reward
      { rows: [] }, // UPDATE users → 0 ligne (solde insuffisant)
      { rows: [{ total_points: 100 }] }, // SELECT fallback → utilisateur trouvé
      { rows: [] } // ROLLBACK
    )

    const error = await purchaseReward(USER_ID, REWARD_ID).catch((e: unknown) => e)

    expect(error).toBeInstanceOf(RewardError)
    expect((error as RewardError).code).toBe('INSUFFICIENT_POINTS')
    const sqls = mockClient.query.mock.calls.map((call) => String(call[0]))
    expect(sqls.some((s) => s.includes('INSERT INTO reward_redemptions'))).toBe(false)
  })

  it('rejette avec USER_NOT_FOUND si le compte a été supprimé (UPDATE conditionnel → 0 ligne et utilisateur introuvable)', async () => {
    setupClientSequence(
      { rows: [] }, // BEGIN
      { rows: [{ points_cost: 120, active: true }] }, // SELECT reward
      { rows: [] }, // UPDATE users → 0 ligne
      { rows: [] }, // SELECT fallback → aucun utilisateur
      { rows: [] } // ROLLBACK
    )

    const error = await purchaseReward(USER_ID, REWARD_ID).catch((e: unknown) => e)

    expect(error).toBeInstanceOf(RewardError)
    expect((error as RewardError).code).toBe('USER_NOT_FOUND')
    const sqls = mockClient.query.mock.calls.map((call) => String(call[0]))
    expect(sqls.some((s) => s.includes('INSERT INTO reward_redemptions'))).toBe(false)
  })

  it('le code généré suit le format RDM-XXXXXXXX en majuscules', async () => {
    setupClientSequence(
      { rows: [] },
      { rows: [{ points_cost: 120, active: true }] },
      { rows: [{ total_points: 380 }] },
      { rows: [] },
      { rows: [{ id: REDEMPTION_ID }] },
      { rows: [] }
    )

    const result = await purchaseReward(USER_ID, REWARD_ID)

    expect(result.code.startsWith('RDM-')).toBe(true)
    expect(result.code).toBe(result.code.toUpperCase())
    expect(result.code).toHaveLength('RDM-'.length + 8)
  })

  it('relance avec un nouveau code via SAVEPOINT en cas de collision (23505) sur le code généré', async () => {
    const collisionError = Object.assign(
      new Error('duplicate key value violates unique constraint'),
      {
        code: '23505',
      }
    )
    setupClientSequence(
      { rows: [] }, // BEGIN
      { rows: [{ points_cost: 120, active: true }] }, // SELECT reward
      { rows: [{ total_points: 380 }] }, // UPDATE users RETURNING
      { rows: [] }, // SAVEPOINT redemption_code (tentative 1)
      collisionError, // INSERT → collision sur le code généré
      { rows: [] }, // ROLLBACK TO SAVEPOINT redemption_code
      { rows: [] }, // SAVEPOINT redemption_code (tentative 2)
      { rows: [{ id: REDEMPTION_ID }] }, // INSERT → succès avec un nouveau code
      { rows: [] } // COMMIT
    )

    const result = await purchaseReward(USER_ID, REWARD_ID)

    expect(result.redemptionId).toBe(REDEMPTION_ID)
    const sqls = mockClient.query.mock.calls.map((call) => String(call[0]).trim())
    expect(sqls.filter((s) => s === 'SAVEPOINT redemption_code')).toHaveLength(2)
    expect(sqls).toContain('ROLLBACK TO SAVEPOINT redemption_code')
    expect(sqls[sqls.length - 1]).toBe('COMMIT')
  })

  it('abandonne et fait un rollback complet après des collisions de code répétées', async () => {
    const collisionError = Object.assign(
      new Error('duplicate key value violates unique constraint'),
      {
        code: '23505',
      }
    )
    setupClientSequence(
      { rows: [] }, // BEGIN
      { rows: [{ points_cost: 120, active: true }] }, // SELECT reward
      { rows: [{ total_points: 380 }] }, // UPDATE users RETURNING
      { rows: [] },
      collisionError, // tentative 1
      { rows: [] },
      { rows: [] },
      collisionError, // tentative 2
      { rows: [] },
      { rows: [] },
      collisionError, // tentative 3 (dernière autorisée) → abandon, propage l'erreur
      { rows: [] } // ROLLBACK
    )

    const error = await purchaseReward(USER_ID, REWARD_ID).catch((e: unknown) => e)

    expect(error).toBe(collisionError)
    const sqls = mockClient.query.mock.calls.map((call) => String(call[0]).trim())
    expect(sqls.filter((s) => s === 'SAVEPOINT redemption_code')).toHaveLength(3)
    expect(sqls[sqls.length - 1]).toBe('ROLLBACK')
    expect(mockClient.release).toHaveBeenCalledOnce()
  })
})
