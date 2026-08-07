import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest'
import jwt from 'jsonwebtoken'

// Mocks hoistés avant les imports du module testé
vi.mock('../../db/pool.js', () => ({
  pool: { query: vi.fn() },
}))

vi.mock('bcrypt', () => ({
  default: {
    hash: vi.fn(),
    compare: vi.fn(),
  },
}))

beforeAll(() => {
  process.env.JWT_SECRET = 'test-access-secret-32chars-minimum!'
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-32chars-min!!'
})

// Imports après les mocks
import { pool } from '../../db/pool.js'
import bcrypt from 'bcrypt'
import { registerUser, loginUser, refreshTokens, logoutUser, recordRgpdConsent } from './auth.service.js'

const mockQuery = pool.query as ReturnType<typeof vi.fn>
const mockHash = bcrypt.hash as ReturnType<typeof vi.fn>
const mockCompare = bcrypt.compare as ReturnType<typeof vi.fn>

const USER_ID = 'aaaaaaaa-0000-0000-0000-000000000001'
const USER_EMAIL = 'alice@nantes.fr'
const PASSWORD = 'Password1'
const HASHED = '$2b$10$mockedHashedPassword'

beforeEach(() => {
  vi.clearAllMocks()
})

// ─── registerUser ─────────────────────────────────────────────────────────────

describe('registerUser', () => {
  it('crée un utilisateur et retourne access + refresh token', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: USER_ID, email: USER_EMAIL }] }) // INSERT user
      .mockResolvedValueOnce({ rows: [] }) // INSERT refresh_token
    mockHash.mockResolvedValue(HASHED)

    const result = await registerUser(USER_EMAIL, PASSWORD)

    expect(result.accessToken).toBeTypeOf('string')
    expect(result.refreshToken).toBeTypeOf('string')
    expect(mockQuery).toHaveBeenCalledTimes(2)
    expect(mockHash).toHaveBeenCalledWith(PASSWORD, 10)
  })

  it("lance EMAIL_EXISTS si l'email est déjà pris", async () => {
    mockHash.mockResolvedValue(HASHED)
    const pgError = Object.assign(new Error('unique violation'), { code: '23505' })
    mockQuery.mockRejectedValueOnce(pgError)

    await expect(registerUser(USER_EMAIL, PASSWORD)).rejects.toThrow('EMAIL_EXISTS')
    expect(mockQuery).toHaveBeenCalledTimes(1)
  })

  it('race condition — deux inscriptions concurrentes avec le même email : une seule réussit', async () => {
    mockHash.mockResolvedValue(HASHED)
    const pgError = Object.assign(new Error('unique violation'), { code: '23505' })
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: USER_ID, email: USER_EMAIL }] }) // INSERT call 1 → succès
      .mockRejectedValueOnce(pgError) // INSERT call 2 → 23505
      .mockResolvedValueOnce({ rows: [] }) // storeRefreshToken call 1

    const results = await Promise.allSettled([
      registerUser(USER_EMAIL, PASSWORD),
      registerUser(USER_EMAIL, PASSWORD),
    ])

    const fulfilled = results.filter((r) => r.status === 'fulfilled')
    const rejected = results.filter((r) => r.status === 'rejected')

    expect(fulfilled).toHaveLength(1)
    expect(rejected).toHaveLength(1)
    expect((rejected[0] as PromiseRejectedResult).reason.message).toBe('EMAIL_EXISTS')
  })
})

// ─── loginUser ────────────────────────────────────────────────────────────────

describe('loginUser', () => {
  it('authentifie un utilisateur et retourne les tokens', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: USER_ID, email: USER_EMAIL, password_hash: HASHED }] })
      .mockResolvedValueOnce({ rows: [] }) // INSERT refresh_token
    mockCompare.mockResolvedValue(true)

    const result = await loginUser(USER_EMAIL, PASSWORD, true)

    expect(result.accessToken).toBeTypeOf('string')
    expect(result.refreshToken).toBeTypeOf('string')
    expect(mockCompare).toHaveBeenCalledWith(PASSWORD, HASHED)
  })

  it('propage rememberMe=false jusqu\'à la ligne stockée en base', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: USER_ID, email: USER_EMAIL, password_hash: HASHED }] })
      .mockResolvedValueOnce({ rows: [] }) // INSERT refresh_token
    mockCompare.mockResolvedValue(true)

    await loginUser(USER_EMAIL, PASSWORD, false)

    expect(mockQuery).toHaveBeenLastCalledWith(
      'INSERT INTO refresh_tokens (id, user_id, expires_at, remember_me) VALUES ($1, $2, $3, $4)',
      expect.arrayContaining([expect.any(String), USER_ID, expect.any(Date), false])
    )
  })

  it("lance INVALID_CREDENTIALS si l'utilisateur n'existe pas", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] })

    await expect(loginUser(USER_EMAIL, PASSWORD, true)).rejects.toThrow('INVALID_CREDENTIALS')
  })

  it('lance INVALID_CREDENTIALS si le mot de passe est incorrect', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: USER_ID, email: USER_EMAIL, password_hash: HASHED }],
    })
    mockCompare.mockResolvedValue(false)

    await expect(
      loginUser(USER_EMAIL, 'MauvaisMotDePasse1', true)
    ).rejects.toThrow('INVALID_CREDENTIALS')
  })
})

// ─── refreshTokens ────────────────────────────────────────────────────────────

describe('refreshTokens', () => {
  function makeRefreshToken(jti: string): string {
    return jwt.sign({ sub: USER_ID, email: USER_EMAIL, jti }, process.env.JWT_REFRESH_SECRET!, {
      expiresIn: '7d',
    })
  }

  it('émet de nouveaux tokens si le jti existe en base', async () => {
    const jti = 'bbbbbbbb-0000-0000-0000-000000000002'
    const token = makeRefreshToken(jti)

    mockQuery
      .mockResolvedValueOnce({
        rows: [{ id: jti, rotated_at: null, replaced_by: null, remember_me: true }],
      }) // getTokenRow : jti valide, pas encore tourné
      .mockResolvedValueOnce({ rows: [] }) // INSERT nouvelle ligne (avant l'UPDATE, contrainte FK replaced_by)
      .mockResolvedValueOnce({ rowCount: 1 }) // UPDATE ... WHERE rotated_at IS NULL (rotation gagnée)

    const result = await refreshTokens(token)

    expect(result.accessToken).toBeTypeOf('string')
    expect(result.refreshToken).toBeTypeOf('string')
    expect(result.rememberMe).toBe(true)
    // Le nouveau refresh token doit contenir un jti différent
    const decoded = jwt.decode(result.refreshToken) as { jti: string }
    expect(decoded.jti).not.toBe(jti)
  })

  it("reporte remember_me=false de l'ancienne ligne sur la nouvelle lors de la rotation", async () => {
    const jti = 'bbbbbbbc-0000-0000-0000-00000000000a'
    const token = makeRefreshToken(jti)

    mockQuery
      .mockResolvedValueOnce({
        rows: [{ id: jti, rotated_at: null, replaced_by: null, remember_me: false }],
      })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rowCount: 1 })

    const result = await refreshTokens(token)

    expect(result.rememberMe).toBe(false)
    expect(mockQuery).toHaveBeenNthCalledWith(
      2,
      'INSERT INTO refresh_tokens (id, user_id, expires_at, remember_me) VALUES ($1, $2, $3, $4)',
      expect.arrayContaining([expect.any(String), USER_ID, expect.any(Date), false])
    )
  })

  it('lance INVALID_TOKEN si le JWT est invalide', async () => {
    await expect(refreshTokens('token.invalide.ici')).rejects.toThrow('INVALID_TOKEN')
  })

  it('lance INVALID_TOKEN si le jti est absent de la base (révoqué)', async () => {
    const token = makeRefreshToken('cccccccc-0000-0000-0000-000000000003')
    mockQuery.mockResolvedValueOnce({ rows: [] }) // getTokenRow ne trouve rien

    await expect(refreshTokens(token)).rejects.toThrow('INVALID_TOKEN')
    expect(mockQuery).toHaveBeenCalledTimes(1)
  })

  it('insère la nouvelle ligne avant de tourner l\'ancienne (contrainte FK replaced_by)', async () => {
    const jti = 'bbbbbbbd-0000-0000-0000-00000000000b'
    const token = makeRefreshToken(jti)

    mockQuery
      .mockResolvedValueOnce({
        rows: [{ id: jti, rotated_at: null, replaced_by: null, remember_me: true }],
      })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rowCount: 1 })

    await refreshTokens(token)

    const [firstQuery] = mockQuery.mock.calls[1] as [string]
    const [secondQuery] = mockQuery.mock.calls[2] as [string]
    expect(firstQuery).toContain('INSERT INTO refresh_tokens')
    expect(secondQuery).toContain('UPDATE refresh_tokens')
  })

  it('rejoue le même jti déjà tourné dans la fenêtre de grâce → réémet pour la feuille active (pas de 401)', async () => {
    const jti = 'eeeeeeee-0000-0000-0000-000000000005'
    const leafJti = 'ffffffff-0000-0000-0000-000000000006'
    const token = makeRefreshToken(jti)
    const rotatedRow = { id: jti, rotated_at: new Date().toISOString(), replaced_by: leafJti, remember_me: true }

    mockQuery
      .mockResolvedValueOnce({ rows: [rotatedRow] }) // getTokenRow : déjà tourné il y a <10s
      .mockResolvedValueOnce({ rows: [] }) // INSERT (ligne orpheline, le CAS va échouer)
      .mockResolvedValueOnce({ rowCount: 0 }) // UPDATE : perdu la course, déjà tourné
      .mockResolvedValueOnce({ rows: [] }) // DELETE de la ligne orpheline
      .mockResolvedValueOnce({ rows: [rotatedRow] }) // getTokenRow (fenêtre de grâce) : même état
      .mockResolvedValueOnce({
        rows: [{ id: leafJti, rotated_at: null, replaced_by: null, remember_me: true }],
      }) // resolveLeafToken trouve la feuille

    const result = await refreshTokens(token)

    expect(result.accessToken).toBeTypeOf('string')
    expect(result.rememberMe).toBe(true)
    const decoded = jwt.decode(result.refreshToken) as { jti: string }
    expect(decoded.jti).toBe(leafJti)
  })

  it('lance INVALID_TOKEN si le jti a été tourné il y a plus de 10s (hors fenêtre de grâce)', async () => {
    const jti = 'aaaaaaab-0000-0000-0000-000000000007'
    const token = makeRefreshToken(jti)
    const rotatedAt = new Date(Date.now() - 15_000).toISOString()
    const rotatedRow = { id: jti, rotated_at: rotatedAt, replaced_by: 'whatever', remember_me: true }

    mockQuery
      .mockResolvedValueOnce({ rows: [rotatedRow] }) // getTokenRow : déjà tourné il y a >10s
      .mockResolvedValueOnce({ rows: [] }) // INSERT (orpheline)
      .mockResolvedValueOnce({ rowCount: 0 }) // UPDATE : perdu la course
      .mockResolvedValueOnce({ rows: [] }) // DELETE de la ligne orpheline
      .mockResolvedValueOnce({ rows: [rotatedRow] }) // getTokenRow (fenêtre de grâce) : hors délai

    await expect(refreshTokens(token)).rejects.toThrow('INVALID_TOKEN')
  })
})

// ─── logoutUser ───────────────────────────────────────────────────────────────

describe('logoutUser', () => {
  it('supprime le jti de la base si le token est valide', async () => {
    const jti = 'dddddddd-0000-0000-0000-000000000004'
    const token = jwt.sign(
      { sub: USER_ID, email: USER_EMAIL, jti },
      process.env.JWT_REFRESH_SECRET!,
      { expiresIn: '7d' }
    )
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: jti, rotated_at: null, replaced_by: null }] }) // resolveLeafTokenId : jti = feuille
      .mockResolvedValueOnce({ rows: [] }) // DELETE

    await logoutUser(token)

    expect(mockQuery).toHaveBeenCalledWith('DELETE FROM refresh_tokens WHERE id = $1', [jti])
  })

  it('révoque la session active si le cookie présenté est un jti déjà tourné', async () => {
    const oldJti = 'aaaaaaac-0000-0000-0000-000000000008'
    const leafJti = 'aaaaaaad-0000-0000-0000-000000000009'
    const token = jwt.sign(
      { sub: USER_ID, email: USER_EMAIL, jti: oldJti },
      process.env.JWT_REFRESH_SECRET!,
      { expiresIn: '7d' }
    )

    mockQuery
      .mockResolvedValueOnce({
        rows: [{ id: oldJti, rotated_at: new Date().toISOString(), replaced_by: leafJti }],
      }) // resolveLeafTokenId : oldJti est tourné, suit vers leafJti
      .mockResolvedValueOnce({ rows: [{ id: leafJti, rotated_at: null, replaced_by: null }] }) // leafJti = feuille
      .mockResolvedValueOnce({ rows: [] }) // DELETE

    await logoutUser(token)

    expect(mockQuery).toHaveBeenCalledWith('DELETE FROM refresh_tokens WHERE id = $1', [leafJti])
  })

  it("ne lance pas d'erreur si le token est invalide (révoqué ou expiré)", async () => {
    await expect(logoutUser('token.invalide')).resolves.toBeUndefined()
    expect(mockQuery).not.toHaveBeenCalled()
  })
})

// ─── recordRgpdConsent ────────────────────────────────────────────────────────

describe('recordRgpdConsent', () => {
  it("horodate le consentement de l'utilisateur", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] })

    await recordRgpdConsent(USER_ID)

    expect(mockQuery).toHaveBeenCalledWith('UPDATE users SET rgpd_consent_at = now() WHERE id = $1', [
      USER_ID,
    ])
  })
})
