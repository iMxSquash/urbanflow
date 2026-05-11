import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { randomUUID } from 'crypto'
import { pool } from '../../db/pool.js'
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
  return jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: ACCESS_EXPIRY })
}

function signRefreshToken(payload: AuthTokenPayload, jti: string): string {
  return jwt.sign({ ...payload, jti }, process.env.JWT_REFRESH_SECRET!, { expiresIn: REFRESH_EXPIRY })
}

async function storeRefreshToken(userId: string, jti: string): Promise<void> {
  const expiresAt = new Date(Date.now() + REFRESH_EXPIRY_MS)
  await pool.query('INSERT INTO refresh_tokens (id, user_id, expires_at) VALUES ($1, $2, $3)', [
    jti,
    userId,
    expiresAt,
  ])
}

export async function registerUser(
  email: string,
  password: string,
): Promise<{ accessToken: string; refreshToken: string }> {
  const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email])
  if (existing.rows.length > 0) {
    throw new Error('EMAIL_EXISTS')
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS)
  const result = await pool.query(
    'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email',
    [email, passwordHash],
  )

  const user = result.rows[0] as { id: string; email: string }
  const payload: AuthTokenPayload = { sub: user.id, email: user.email }
  const jti = randomUUID()

  const [accessToken, refreshToken] = await Promise.all([
    Promise.resolve(signAccessToken(payload)),
    Promise.resolve(signRefreshToken(payload, jti)),
    storeRefreshToken(user.id, jti),
  ])

  return { accessToken, refreshToken }
}

export async function loginUser(
  email: string,
  password: string,
): Promise<{ accessToken: string; refreshToken: string }> {
  const result = await pool.query('SELECT id, email, password_hash FROM users WHERE email = $1', [email])
  const user = result.rows[0] as { id: string; email: string; password_hash: string } | undefined

  // bcrypt.compare s'exécute toujours pour égaliser le timing (anti-énumération).
  const hashToCompare = user?.password_hash ?? (await getDummyHash())
  const valid = await bcrypt.compare(password, hashToCompare)

  if (!user || !valid) {
    throw new Error('INVALID_CREDENTIALS')
  }

  const payload: AuthTokenPayload = { sub: user.id, email: user.email }
  const jti = randomUUID()

  const [accessToken, refreshToken] = await Promise.all([
    Promise.resolve(signAccessToken(payload)),
    Promise.resolve(signRefreshToken(payload, jti)),
    storeRefreshToken(user.id, jti),
  ])

  return { accessToken, refreshToken }
}

export async function refreshTokens(
  incomingToken: string,
): Promise<{ accessToken: string; refreshToken: string }> {
  let payload: RefreshTokenPayload
  try {
    payload = jwt.verify(incomingToken, process.env.JWT_REFRESH_SECRET!) as RefreshTokenPayload
  } catch {
    throw new Error('INVALID_TOKEN')
  }

  // Rotation : delete old jti, only if not expired in DB
  const deleted = await pool.query(
    'DELETE FROM refresh_tokens WHERE id = $1 AND user_id = $2 AND expires_at > now() RETURNING id',
    [payload.jti, payload.sub],
  )
  if (deleted.rowCount === 0) {
    throw new Error('INVALID_TOKEN')
  }

  const newPayload: AuthTokenPayload = { sub: payload.sub, email: payload.email }
  const newJti = randomUUID()

  const [accessToken, refreshToken] = await Promise.all([
    Promise.resolve(signAccessToken(newPayload)),
    Promise.resolve(signRefreshToken(newPayload, newJti)),
    storeRefreshToken(payload.sub, newJti),
  ])

  return { accessToken, refreshToken }
}

export async function logoutUser(incomingToken: string): Promise<void> {
  let payload: RefreshTokenPayload
  try {
    payload = jwt.verify(incomingToken, process.env.JWT_REFRESH_SECRET!) as RefreshTokenPayload
  } catch {
    return // Token invalide ou expiré — rien à révoquer
  }
  // Les erreurs DB propagent ici pour que le controller retourne 500.
  await pool.query('DELETE FROM refresh_tokens WHERE id = $1', [payload.jti])
}
