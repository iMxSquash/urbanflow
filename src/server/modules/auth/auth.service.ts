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

// Fenêtre de grâce anti-course sur la rotation du refresh token : deux
// requêtes concurrentes sur le même cookie (StrictMode, double onglet, retry
// réseau) ne doivent pas déconnecter la « perdante ». Au-delà de la fenêtre,
// un jti déjà tourné est traité comme un rejeu — refusé.
const ROTATION_GRACE_MS = 10_000
const MAX_GRACE_HOPS = 5

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

async function storeRefreshToken(userId: string, jti: string, rememberMe: boolean): Promise<void> {
  const expiresAt = new Date(Date.now() + REFRESH_EXPIRY_MS)
  await pool.query(
    'INSERT INTO refresh_tokens (id, user_id, expires_at, remember_me) VALUES ($1, $2, $3, $4)',
    [jti, userId, expiresAt, rememberMe]
  )
}

interface RefreshTokenRow {
  id: string
  rotated_at: string | null
  replaced_by: string | null
  remember_me: boolean
}

async function getTokenRow(id: string, userId: string): Promise<RefreshTokenRow | null> {
  const result = await pool.query<RefreshTokenRow>(
    'SELECT id, rotated_at, replaced_by, remember_me FROM refresh_tokens WHERE id = $1 AND user_id = $2 AND expires_at > now()',
    [id, userId]
  )
  return result.rows[0] ?? null
}

// Suit la chaîne de rotation jusqu'à la feuille (jamais tournée) encore
// valide. Utilisé par le chemin de grâce du refresh et par le logout, pour
// que révoquer un jti périmé révoque bien la session active qui lui a
// succédé.
async function resolveLeafToken(
  startId: string | null,
  userId: string
): Promise<{ id: string; rememberMe: boolean } | null> {
  let currentId = startId
  for (let hop = 0; hop < MAX_GRACE_HOPS && currentId; hop++) {
    const row = await getTokenRow(currentId, userId)
    if (!row) return null
    if (row.rotated_at === null) return { id: row.id, rememberMe: row.remember_me }
    currentId = row.replaced_by
  }
  return null
}

async function issueTokenPair(
  payload: AuthTokenPayload,
  rememberMe: boolean
): Promise<{ accessToken: string; refreshToken: string }> {
  const jti = randomUUID()
  const accessToken = signAccessToken(payload)
  const refreshToken = signRefreshToken(payload, jti)
  await storeRefreshToken(payload.sub, jti, rememberMe)
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

  // Pas de case "Rester connecté" à l'inscription — cookie persistant par défaut.
  return issueTokenPair({ sub: user.id, email: user.email }, true)
}

export async function loginUser(
  email: string,
  password: string,
  rememberMe: boolean
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

  return issueTokenPair({ sub: user.id, email: user.email }, rememberMe)
}

export async function refreshTokens(
  incomingToken: string
): Promise<{ accessToken: string; refreshToken: string; rememberMe: boolean }> {
  let payload: RefreshTokenPayload
  try {
    payload = jwt.verify(incomingToken, requireEnv('JWT_REFRESH_SECRET')) as RefreshTokenPayload
  } catch {
    throw new InvalidTokenError()
  }

  const newPayload: AuthTokenPayload = { sub: payload.sub, email: payload.email }
  const newJti = randomUUID()

  // Rotation : le WHERE rotated_at IS NULL agit comme un CAS atomique — une
  // seule requête concurrente peut gagner la rotation d'un jti donné.
  // remember_me est reporté tel quel sur la nouvelle ligne : le choix
  // "Rester connecté" du login doit survivre à toutes les rotations d'une
  // même session, sinon /refresh écraserait un cookie de session par un
  // cookie persistant (ou l'inverse) à chaque appel.
  const rotated = await pool.query<{ id: string; remember_me: boolean }>(
    `UPDATE refresh_tokens SET rotated_at = now(), replaced_by = $1
     WHERE id = $2 AND user_id = $3 AND expires_at > now() AND rotated_at IS NULL
     RETURNING id, remember_me`,
    [newJti, payload.jti, payload.sub]
  )
  const rotatedRow = rotated.rows[0]

  if (rotatedRow) {
    await storeRefreshToken(payload.sub, newJti, rotatedRow.remember_me)
    return {
      accessToken: signAccessToken(newPayload),
      refreshToken: signRefreshToken(newPayload, newJti),
      rememberMe: rotatedRow.remember_me,
    }
  }

  return refreshWithinGraceWindow(payload)
}

// Le CAS ci-dessus n'a rien mis à jour : jti inconnu/expiré, ou déjà tourné
// par une requête concurrente sur le même cookie. Dans ce dernier cas, si on
// est encore dans la fenêtre de grâce, on retrouve la session active au bout
// de la chaîne de rotation plutôt que de déconnecter la requête perdante.
async function refreshWithinGraceWindow(
  payload: RefreshTokenPayload
): Promise<{ accessToken: string; refreshToken: string; rememberMe: boolean }> {
  const row = await getTokenRow(payload.jti, payload.sub)
  if (!row || row.rotated_at === null) {
    throw new InvalidTokenError()
  }

  const rotatedAgoMs = Date.now() - new Date(row.rotated_at).getTime()
  if (rotatedAgoMs > ROTATION_GRACE_MS) {
    throw new InvalidTokenError()
  }

  const leaf = await resolveLeafToken(row.replaced_by, payload.sub)
  if (!leaf) throw new InvalidTokenError()

  const newPayload: AuthTokenPayload = { sub: payload.sub, email: payload.email }
  return {
    accessToken: signAccessToken(newPayload),
    refreshToken: signRefreshToken(newPayload, leaf.id),
    rememberMe: leaf.rememberMe,
  }
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
  // Résout jusqu'à la session active (le cookie présenté peut être un jti
  // déjà tourné dans un autre onglet) pour que le logout révoque bien la
  // session en cours, pas seulement le jti périmé qu'on a sous la main.
  const leaf = await resolveLeafToken(payload.jti, payload.sub)
  if (leaf) {
    // Les erreurs DB propagent ici pour que le controller retourne 500.
    await pool.query('DELETE FROM refresh_tokens WHERE id = $1', [leaf.id])
  }
}
