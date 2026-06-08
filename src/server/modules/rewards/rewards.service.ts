import { randomUUID } from 'crypto'
import { pool } from '../../db/pool.js'
import type { PurchaseResult, RewardCatalog, RewardType, UserRedemption } from './rewards.types.js'

export type RewardErrorCode = 'NOT_FOUND' | 'INACTIVE' | 'INSUFFICIENT_POINTS' | 'USER_NOT_FOUND'

export class RewardError extends Error {
  constructor(
    public readonly code: RewardErrorCode,
    message: string
  ) {
    super(message)
    this.name = 'RewardError'
  }
}

// ── getCatalog ────────────────────────────────────────────────────────────────

export async function getCatalog(userId: string): Promise<RewardCatalog> {
  const [rewardsResult, userResult] = await Promise.all([
    pool.query<{
      id: string
      name: string
      description: string
      reward_type: RewardType
      points_cost: number
      partner_name: string
    }>(
      `SELECT id, name, description, reward_type, points_cost, partner_name
       FROM rewards
       WHERE active = true
       ORDER BY points_cost`
    ),
    pool.query<{ total_points: number }>(`SELECT total_points FROM users WHERE id = $1`, [userId]),
  ])

  const totalPoints = userResult.rows[0]?.total_points ?? 0

  return {
    totalPoints,
    rewards: rewardsResult.rows.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      rewardType: row.reward_type,
      pointsCost: row.points_cost,
      partnerName: row.partner_name,
      affordable: totalPoints >= row.points_cost,
    })),
  }
}

// ── getUserRedemptions ────────────────────────────────────────────────────────

export async function getUserRedemptions(userId: string): Promise<UserRedemption[]> {
  const { rows } = await pool.query<{
    id: string
    reward_id: string
    reward_name: string
    reward_type: RewardType
    partner_name: string
    code: string
    points_spent: number
    redeemed_at: string
  }>(
    `SELECT
       rr.id, rr.reward_id, r.name AS reward_name, r.reward_type, r.partner_name,
       rr.code, rr.points_spent, rr.redeemed_at
     FROM reward_redemptions rr
     JOIN rewards r ON r.id = rr.reward_id
     WHERE rr.user_id = $1
     ORDER BY rr.redeemed_at DESC`,
    [userId]
  )

  return rows.map((row) => ({
    id: row.id,
    rewardId: row.reward_id,
    rewardName: row.reward_name,
    rewardType: row.reward_type,
    partnerName: row.partner_name,
    code: row.code,
    pointsSpent: row.points_spent,
    redeemedAt: row.redeemed_at,
  }))
}

// ── purchaseReward ────────────────────────────────────────────────────────────

export async function purchaseReward(userId: string, rewardId: string): Promise<PurchaseResult> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const rewardResult = await client.query<{ points_cost: number; active: boolean }>(
      `SELECT points_cost, active FROM rewards WHERE id = $1`,
      [rewardId]
    )
    const reward = rewardResult.rows[0]
    if (!reward) throw new RewardError('NOT_FOUND', 'Récompense introuvable')
    if (!reward.active) {
      throw new RewardError('INACTIVE', "Cette récompense n'est plus disponible")
    }

    // Décrément atomique et conditionnel : évite toute race condition sur le solde,
    // sans recourir à un verrou explicite (SELECT ... FOR UPDATE)
    const userResult = await client.query<{ total_points: number }>(
      `UPDATE users SET total_points = total_points - $1
       WHERE id = $2 AND total_points >= $1
       RETURNING total_points`,
      [reward.points_cost, userId]
    )
    const userRow = userResult.rows[0]
    if (!userRow) {
      // L'UPDATE conditionnel ne distingue pas "solde insuffisant" de "compte supprimé" :
      // on relit l'utilisateur pour renvoyer une erreur fidèle au cas réel.
      const existingUser = await client.query<{ total_points: number }>(
        `SELECT total_points FROM users WHERE id = $1`,
        [userId]
      )
      if (!existingUser.rows[0]) throw new RewardError('USER_NOT_FOUND', 'Utilisateur introuvable')
      throw new RewardError('INSUFFICIENT_POINTS', 'Solde de points insuffisant')
    }

    const code = `RDM-${randomUUID().slice(0, 8).toUpperCase()}`

    const redemptionResult = await client.query<{ id: string }>(
      `INSERT INTO reward_redemptions (user_id, reward_id, code, points_spent)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [userId, rewardId, code, reward.points_cost]
    )
    const redemptionRow = redemptionResult.rows[0]
    if (!redemptionRow) throw new Error('Redemption insert returned no row')

    await client.query('COMMIT')

    return {
      redemptionId: redemptionRow.id,
      code,
      pointsSpent: reward.points_cost,
      totalPoints: userRow.total_points,
    }
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}
