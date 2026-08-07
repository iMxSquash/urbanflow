import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { randomUUID } from 'crypto'
import { pool } from '../../db/pool.js'
import { requireEnv } from '../../config/env.js'
import {
  EmailExistsError,
  InvalidCredentialsError,
  InvalidTokenError,
  UserNotFoundError,
} from './auth.errors.js'
import type { AuthTokenPayload, RefreshTokenPayload } from './auth.types.js'

const BCRYPT_ROUNDS = 10
const ACCESS_EXPIRY = '15m'
const REFRESH_EXPIRY = '7d'
const REFRESH_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000

// Hash factice pré-calculé pour égaliser le timing sur loginUser
// même quand l'email n'existe pas (défense contre l'énumération de comptes).
let _dummyHash: string | undefined
async function getDummyHash(): Promise<string> {
  if (!_dummyHash) _dummyHash = await bcrypt.hash('_dummy_', BCRYPT_ROUNDS)
  return _dummyHash
}

function signAccessToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, requireEnv('JWT_SECRET'), { expiresIn: ACCESS_EXPIRY })
}

function signRefreshToken(payload: AuthTokenPayload, jti: string): string {
  return jwt.sign({ ...payload, jti }, requireEnv('JWT_REFRESH_SECRET'), {
    expiresIn: REFRESH_EXPIRY,
  })
}

async function storeRefreshToken(userId: string, jti: string): Promise<void> {
  const expiresAt = new Date(Date.now() + REFRESH_EXPIRY_MS)
  await pool.query('INSERT INTO refresh_tokens (id, user_id, expires_at) VALUES ($1, $2, $3)', [
    jti,
    userId,
    expiresAt,
  ])
}

async function issueTokenPair(
  payload: AuthTokenPayload
): Promise<{ accessToken: string; refreshToken: string }> {
  const jti = randomUUID()
  const accessToken = signAccessToken(payload)
  const refreshToken = signRefreshToken(payload, jti)
  await storeRefreshToken(payload.sub, jti)
  return { accessToken, refreshToken }
}

export async function registerUser(
  email: string,
  password: string
): Promise<{ accessToken: string; refreshToken: string }> {
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS)

  let user: { id: string; email: string }
  try {
    // termsAccepted est validé à `true` par le schéma Zod avant d'arriver ici
    // (registerSchema) — l'inscription ne peut pas aboutir sans acceptation.
    const result = await pool.query(
      'INSERT INTO users (email, password_hash, terms_accepted_at) VALUES ($1, $2, now()) RETURNING id, email',
      [email, passwordHash]
    )
    user = result.rows[0] as { id: string; email: string }
  } catch (err) {
    if ((err as { code?: string }).code === '23505') throw new EmailExistsError(err)
    throw err
  }

  return issueTokenPair({ sub: user.id, email: user.email })
}

export async function loginUser(
  email: string,
  password: string
): Promise<{ accessToken: string; refreshToken: string }> {
  const result = await pool.query('SELECT id, email, password_hash FROM users WHERE email = $1', [
    email,
  ])
  const user = result.rows[0] as { id: string; email: string; password_hash: string } | undefined

  // bcrypt.compare s'exécute toujours pour égaliser le timing (anti-énumération).
  const hashToCompare = user?.password_hash ?? (await getDummyHash())
  const valid = await bcrypt.compare(password, hashToCompare)

  if (!user || !valid) {
    throw new InvalidCredentialsError()
  }

  return issueTokenPair({ sub: user.id, email: user.email })
}

export async function refreshTokens(
  incomingToken: string
): Promise<{ accessToken: string; refreshToken: string }> {
  let payload: RefreshTokenPayload
  try {
    payload = jwt.verify(incomingToken, requireEnv('JWT_REFRESH_SECRET')) as RefreshTokenPayload
  } catch {
    throw new InvalidTokenError()
  }

  // Rotation : delete old jti, only if not expired in DB
  const deleted = await pool.query(
    'DELETE FROM refresh_tokens WHERE id = $1 AND user_id = $2 AND expires_at > now() RETURNING id',
    [payload.jti, payload.sub]
  )
  if (deleted.rowCount === 0) {
    throw new InvalidTokenError()
  }

  return issueTokenPair({ sub: payload.sub, email: payload.email })
}

export async function deleteAccount(userId: string): Promise<void> {
  // La suppression cascade sur mobility_profiles, trips, user_badges, refresh_tokens (ON DELETE CASCADE)
  await pool.query('DELETE FROM users WHERE id = $1', [userId])
}

// Trace serveur du consentement géolocalisation (accountabilité RGPD, art. 5.2) —
// appelé quand l'utilisateur accepte la modale GeolocationConsent côté client.
export async function recordRgpdConsent(userId: string): Promise<void> {
  await pool.query('UPDATE users SET rgpd_consent_at = now() WHERE id = $1', [userId])
}

export interface AccountInfo {
  email: string
  createdAt: string
  rgpdConsentAt: string | null
  termsAcceptedAt: string | null
  totalPoints: number
}

export async function getAccountInfo(userId: string): Promise<AccountInfo> {
  const result = await pool.query<{
    email: string
    created_at: string
    rgpd_consent_at: string | null
    terms_accepted_at: string | null
    total_points: number
  }>(
    'SELECT email, created_at, rgpd_consent_at, terms_accepted_at, total_points FROM users WHERE id = $1',
    [userId]
  )
  const row = result.rows[0]
  if (!row) throw new UserNotFoundError()

  return {
    email: row.email,
    createdAt: new Date(row.created_at).toISOString(),
    rgpdConsentAt: row.rgpd_consent_at ? new Date(row.rgpd_consent_at).toISOString() : null,
    termsAcceptedAt: row.terms_accepted_at ? new Date(row.terms_accepted_at).toISOString() : null,
    totalPoints: row.total_points,
  }
}

export async function logoutUser(incomingToken: string): Promise<void> {
  let payload: RefreshTokenPayload
  try {
    payload = jwt.verify(incomingToken, requireEnv('JWT_REFRESH_SECRET')) as RefreshTokenPayload
  } catch {
    return // Token invalide ou expiré — rien à révoquer
  }
  // Les erreurs DB propagent ici pour que le controller retourne 500.
  await pool.query('DELETE FROM refresh_tokens WHERE id = $1', [payload.jti])
}
