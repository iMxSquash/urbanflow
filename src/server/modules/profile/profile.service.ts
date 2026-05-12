import { pool } from '../../db/pool.js'
import type { MobilityProfile } from './profile.types.js'
import type { TransportMode, UserPreference } from '../../../shared/types/index.js'

interface ProfileRow {
  user_id: string
  preferred_modes: string[]
  max_walk_minutes: number
  preference: string
  pmr_accessibility: boolean
  updated_at: Date
}

function rowToProfile(row: ProfileRow): MobilityProfile {
  return {
    userId: row.user_id,
    preferredModes: row.preferred_modes as TransportMode[],
    maxWalkMinutes: row.max_walk_minutes,
    preference: row.preference as UserPreference,
    pmrAccessibility: row.pmr_accessibility,
    updatedAt: row.updated_at.toISOString(),
  }
}

const DEFAULT_PROFILE = {
  preferredModes: ['walk', 'tramway', 'bus'] as TransportMode[],
  maxWalkMinutes: 15,
  preference: 'balanced' as UserPreference,
  pmrAccessibility: false,
}

export async function getProfile(userId: string): Promise<MobilityProfile> {
  const result = await pool.query<ProfileRow>(
    `SELECT user_id, preferred_modes, max_walk_minutes, preference, pmr_accessibility, updated_at
     FROM mobility_profiles WHERE user_id = $1`,
    [userId],
  )

  if (result.rows.length === 0) {
    return { userId, ...DEFAULT_PROFILE, updatedAt: new Date().toISOString() }
  }

  return rowToProfile(result.rows[0])
}

export async function upsertProfile(
  userId: string,
  data: {
    preferredModes: TransportMode[]
    maxWalkMinutes: number
    preference: UserPreference
    pmrAccessibility: boolean
  },
): Promise<MobilityProfile> {
  const result = await pool.query<ProfileRow>(
    `INSERT INTO mobility_profiles
       (user_id, preferred_modes, max_walk_minutes, preference, pmr_accessibility, updated_at)
     VALUES ($1, $2, $3, $4, $5, now())
     ON CONFLICT (user_id) DO UPDATE
       SET preferred_modes    = EXCLUDED.preferred_modes,
           max_walk_minutes   = EXCLUDED.max_walk_minutes,
           preference         = EXCLUDED.preference,
           pmr_accessibility  = EXCLUDED.pmr_accessibility,
           updated_at         = EXCLUDED.updated_at
     RETURNING user_id, preferred_modes, max_walk_minutes, preference, pmr_accessibility, updated_at`,
    [userId, data.preferredModes, data.maxWalkMinutes, data.preference, data.pmrAccessibility],
  )

  return rowToProfile(result.rows[0])
}
