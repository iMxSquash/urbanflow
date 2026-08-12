import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest'
import jwt from 'jsonwebtoken'

// Mocks hoistés avant les imports du module testé
vi.mock('../../db/pool.js', () => ({
  pool: { query: vi.fn(), connect: vi.fn() },
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
import {
  registerUser,
  loginUser,
  refreshTokens,
  logoutUser,
  recordRgpdConsent,
  recoverPassword,
  regenerateRecoveryCodes,
} from './auth.service.js'

const mockQuery = pool.query as ReturnType<typeof vi.fn>
const mockConnect = pool.connect as ReturnType<typeof vi.fn>
const mockHash = bcrypt.hash as ReturnType<typeof vi.fn>
const mockCompare = bcrypt.compare as ReturnType<typeof vi.fn>
const mockClient = { query: vi.fn(), release: vi.fn() }

const USER_ID = 'aaaaaaaa-0000-0000-0000-000000000001'
const USER_EMAIL = 'alice@nantes.fr'
const PASSWORD = 'Password1'
const HASHED = '$2b$10$mockedHashedPassword'

beforeEach(() => {
  vi.clearAllMocks()
  mockConnect.mockResolvedValue(mockClient)
})

// ─── registerUser ─────────────────────────────────────────────────────────────

describe('registerUser', () => {
  it('crée un utilisateur et retourne access + refresh token + 8 codes de récupération', async () => {
    mockClient.query
      .mockResolvedValueOnce({ rows: [] }) // BEGIN
      .mockResolvedValueOnce({ rows: [{ id: USER_ID, email: USER_EMAIL }] }) // INSERT user
      .mockResolvedValueOnce({ rows: [] }) // INSERT recovery_codes (bulk)
      .mockResolvedValueOnce({ rows: [] }) // COMMIT
    mockQuery.mockResolvedValueOnce({ rows: [] }) // INSERT refresh_token (hors transaction)
    mockHash.mockResolvedValue(HASHED)

    const result = await registerUser(USER_EMAIL, PASSWORD)

    expect(result.accessToken).toBeTypeOf('string')
    expect(result.refreshToken).toBeTypeOf('string')
    expect(result.recoveryCodes).toHaveLength(8)
    expect(new Set(result.recoveryCodes).size).toBe(8) // pas de doublon
    for (const code of result.recoveryCodes) {
      expect(code).toMatch(/^[0-9A-Z]{4}-[0-9A-Z]{4}-[0-9A-Z]{4}-[0-9A-Z]{4}$/)
    }
    // Utilisateur + codes de récupération dans la même transaction — un
    // échec du 2e INSERT ne doit jamais laisser un compte sans codes.
    expect(mockConnect).toHaveBeenCalledTimes(1)
    expect(mockClient.query).toHaveBeenCalledWith('COMMIT')
    expect(mockClient.release).toHaveBeenCalledTimes(1)
    expect(mockQuery).toHaveBeenCalledTimes(1)
    expect(mockHash).toHaveBeenCalledWith(PASSWORD, 10)
  })

  it("lance EMAIL_EXISTS si l'email est déjà pris, sans toucher au refresh token", async () => {
    mockHash.mockResolvedValue(HASHED)
    const pgError = Object.assign(new Error('unique violation'), { code: '23505' })
    mockClient.query
      .mockResolvedValueOnce({ rows: [] }) // BEGIN
      .mockRejectedValueOnce(pgError) // INSERT user → 23505
      .mockResolvedValueOnce({ rows: [] }) // ROLLBACK

    await expect(registerUser(USER_EMAIL, PASSWORD)).rejects.toThrow('EMAIL_EXISTS')
    expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK')
    expect(mockQuery).not.toHaveBeenCalled()
  })

  it('race condition — deux inscriptions concurrentes avec le même email : une seule réussit', async () => {
    mockHash.mockResolvedValue(HASHED)
    const pgError = Object.assign(new Error('unique violation'), { code: '23505' })
    let userInsertCount = 0
    mockClient.query.mockImplementation((sql: string) => {
      if (sql.startsWith('INSERT INTO users')) {
        userInsertCount++
        return userInsertCount === 1
          ? Promise.resolve({ rows: [{ id: USER_ID, email: USER_EMAIL }] })
          : Promise.reject(pgError)
      }
      return Promise.resolve({ rows: [] })
    })
    mockQuery.mockResolvedValue({ rows: [] }) // storeRefreshToken (gagnant uniquement)

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

  it("propage rememberMe=false jusqu'à la ligne stockée en base", async () => {
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

    await expect(loginUser(USER_EMAIL, 'MauvaisMotDePasse1', true)).rejects.toThrow(
      'INVALID_CREDENTIALS'
    )
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

  it("insère la nouvelle ligne avant de tourner l'ancienne (contrainte FK replaced_by)", async () => {
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
    const rotatedRow = {
      id: jti,
      rotated_at: new Date().toISOString(),
      replaced_by: leafJti,
      remember_me: true,
    }

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
    const rotatedRow = {
      id: jti,
      rotated_at: rotatedAt,
      replaced_by: 'whatever',
      remember_me: true,
    }

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

    expect(mockQuery).toHaveBeenCalledWith(
      'UPDATE users SET rgpd_consent_at = now() WHERE id = $1',
      [USER_ID]
    )
  })
})

// ─── recoverPassword ──────────────────────────────────────────────────────────

describe('recoverPassword', () => {
  const RECOVERY_CODE = 'ABCD-EFGH-JKMN-PQRS'
  const NEW_PASSWORD = 'NewPassword1'
  const CODE_ROW_1 = { id: 'code-1', code_hash: '$2b$10$hash1' }
  const CODE_ROW_2 = { id: 'code-2', code_hash: '$2b$10$hash2' }

  it('valide un code, change le mot de passe, révoque les sessions et retourne un code de remplacement', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: USER_ID }] }) // SELECT users
      .mockResolvedValueOnce({ rows: [CODE_ROW_1, CODE_ROW_2] }) // SELECT recovery_codes non utilisés
    mockCompare.mockResolvedValueOnce(true) // le code correspond au premier hash comparé
    mockHash.mockResolvedValue(HASHED)
    mockClient.query.mockResolvedValue({ rows: [], rowCount: 1 })

    const result = await recoverPassword(USER_EMAIL, RECOVERY_CODE, NEW_PASSWORD)

    expect(result.replacementCode).toMatch(/^[0-9A-Z]{4}-[0-9A-Z]{4}-[0-9A-Z]{4}-[0-9A-Z]{4}$/)
    // Exactement RECOVERY_CODE_COUNT (8) comparaisons, quel que soit le nombre
    // de codes réellement stockés — timing constant (finding égalisation).
    expect(mockCompare).toHaveBeenCalledTimes(8)
    expect(mockConnect).toHaveBeenCalledTimes(1)
    expect(mockClient.query).toHaveBeenCalledWith('BEGIN')
    expect(mockClient.query).toHaveBeenCalledWith(
      'UPDATE recovery_codes SET used_at = now() WHERE id = $1 AND used_at IS NULL',
      [CODE_ROW_1.id]
    )
    expect(mockClient.query).toHaveBeenCalledWith(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [HASHED, USER_ID]
    )
    expect(mockClient.query).toHaveBeenCalledWith('DELETE FROM refresh_tokens WHERE user_id = $1', [
      USER_ID,
    ])
    expect(mockClient.query).toHaveBeenCalledWith('COMMIT')
    expect(mockClient.release).toHaveBeenCalledTimes(1)
  })

  it('lance INVALID_RECOVERY_CODE si aucun code stocké ne correspond, sans toucher à la transaction', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: USER_ID }] })
      .mockResolvedValueOnce({ rows: [CODE_ROW_1, CODE_ROW_2] })
    mockCompare.mockResolvedValue(false)

    await expect(recoverPassword(USER_EMAIL, 'code-invalide', NEW_PASSWORD)).rejects.toThrow(
      'INVALID_RECOVERY_CODE'
    )
    expect(mockCompare).toHaveBeenCalledTimes(8)
    expect(mockConnect).not.toHaveBeenCalled()
  })

  it("lance INVALID_RECOVERY_CODE si l'email est inconnu, avec le même nombre de comparaisons qu'un email connu", async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [] }) // SELECT users : aucun résultat
      .mockResolvedValueOnce({ rows: [] }) // SELECT recovery_codes : rien à comparer

    await expect(recoverPassword('inconnu@nantes.fr', RECOVERY_CODE, NEW_PASSWORD)).rejects.toThrow(
      'INVALID_RECOVERY_CODE'
    )
    // Aucun code réel à comparer : les 8 comparaisons se font contre le hash
    // factice — même coût observable que le cas "email connu, aucun match".
    expect(mockCompare).toHaveBeenCalledTimes(8)
    expect(mockConnect).not.toHaveBeenCalled()
  })

  it('marque le bon code comme utilisé même quand il ne correspond pas au premier hash testé', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: USER_ID }] })
      .mockResolvedValueOnce({ rows: [CODE_ROW_1, CODE_ROW_2] })
    mockCompare.mockResolvedValueOnce(false).mockResolvedValueOnce(true) // correspond au 2e hash
    mockHash.mockResolvedValue(HASHED)
    mockClient.query.mockResolvedValue({ rows: [], rowCount: 1 })

    await recoverPassword(USER_EMAIL, RECOVERY_CODE, NEW_PASSWORD)

    expect(mockClient.query).toHaveBeenCalledWith(
      'UPDATE recovery_codes SET used_at = now() WHERE id = $1 AND used_at IS NULL',
      [CODE_ROW_2.id]
    )
  })

  it('lance INVALID_RECOVERY_CODE si le code a déjà été consommé par une requête concurrente', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: USER_ID }] })
      .mockResolvedValueOnce({ rows: [CODE_ROW_1, CODE_ROW_2] })
    mockCompare.mockResolvedValueOnce(true) // le code est valide...
    mockHash.mockResolvedValue(HASHED)
    // ...mais une autre requête a déjà consommé ce même code entre temps : le
    // CAS `AND used_at IS NULL` ne met à jour aucune ligne (rowCount 0).
    mockClient.query.mockImplementation((sql: string) => {
      if (sql.startsWith('UPDATE recovery_codes')) {
        return Promise.resolve({ rows: [], rowCount: 0 })
      }
      return Promise.resolve({ rows: [] })
    })

    await expect(recoverPassword(USER_EMAIL, RECOVERY_CODE, NEW_PASSWORD)).rejects.toThrow(
      'INVALID_RECOVERY_CODE'
    )
    expect(mockClient.query).not.toHaveBeenCalledWith('COMMIT')
    expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK')
  })
})

// ─── regenerateRecoveryCodes ──────────────────────────────────────────────────

describe('regenerateRecoveryCodes', () => {
  it('invalide les codes existants et émet un nouveau jeu de 8 codes', async () => {
    mockHash.mockResolvedValue(HASHED)
    mockClient.query.mockResolvedValue({ rows: [] })

    const codes = await regenerateRecoveryCodes(USER_ID)

    expect(codes).toHaveLength(8)
    expect(new Set(codes).size).toBe(8)
    for (const code of codes) {
      expect(code).toMatch(/^[0-9A-Z]{4}-[0-9A-Z]{4}-[0-9A-Z]{4}-[0-9A-Z]{4}$/)
    }
    expect(mockClient.query).toHaveBeenCalledWith('BEGIN')
    expect(mockClient.query).toHaveBeenCalledWith('DELETE FROM recovery_codes WHERE user_id = $1', [
      USER_ID,
    ])
    expect(mockClient.query).toHaveBeenCalledWith(
      'INSERT INTO recovery_codes (user_id, code_hash) SELECT $1, unnest($2::text[])',
      [USER_ID, Array(8).fill(HASHED)]
    )
    expect(mockClient.query).toHaveBeenCalledWith('COMMIT')
    expect(mockClient.release).toHaveBeenCalledTimes(1)
  })
})
