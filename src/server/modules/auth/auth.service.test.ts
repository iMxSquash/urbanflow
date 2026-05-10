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
import { registerUser, loginUser, refreshTokens, logoutUser } from './auth.service.js'

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
      .mockResolvedValueOnce({ rows: [] })                                          // email check
      .mockResolvedValueOnce({ rows: [{ id: USER_ID, email: USER_EMAIL }] })        // INSERT user
      .mockResolvedValueOnce({ rows: [] })                                          // INSERT refresh_token
    mockHash.mockResolvedValue(HASHED)

    const result = await registerUser(USER_EMAIL, PASSWORD)

    expect(result.accessToken).toBeTypeOf('string')
    expect(result.refreshToken).toBeTypeOf('string')
    expect(mockQuery).toHaveBeenCalledTimes(3)
    expect(mockHash).toHaveBeenCalledWith(PASSWORD, 10)
  })

  it("lance EMAIL_EXISTS si l'email est déjà pris", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: USER_ID }] })

    await expect(registerUser(USER_EMAIL, PASSWORD)).rejects.toThrow('EMAIL_EXISTS')
    expect(mockQuery).toHaveBeenCalledTimes(1)
  })
})

// ─── loginUser ────────────────────────────────────────────────────────────────

describe('loginUser', () => {
  it('authentifie un utilisateur et retourne les tokens', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: USER_ID, email: USER_EMAIL, password_hash: HASHED }] })
      .mockResolvedValueOnce({ rows: [] })  // INSERT refresh_token
    mockCompare.mockResolvedValue(true)

    const result = await loginUser(USER_EMAIL, PASSWORD)

    expect(result.accessToken).toBeTypeOf('string')
    expect(result.refreshToken).toBeTypeOf('string')
    expect(mockCompare).toHaveBeenCalledWith(PASSWORD, HASHED)
  })

  it("lance INVALID_CREDENTIALS si l'utilisateur n'existe pas", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] })

    await expect(loginUser(USER_EMAIL, PASSWORD)).rejects.toThrow('INVALID_CREDENTIALS')
  })

  it('lance INVALID_CREDENTIALS si le mot de passe est incorrect', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: USER_ID, email: USER_EMAIL, password_hash: HASHED }] })
    mockCompare.mockResolvedValue(false)

    await expect(loginUser(USER_EMAIL, 'MauvaisMotDePasse1')).rejects.toThrow('INVALID_CREDENTIALS')
  })
})

// ─── refreshTokens ────────────────────────────────────────────────────────────

describe('refreshTokens', () => {
  function makeRefreshToken(jti: string): string {
    return jwt.sign(
      { sub: USER_ID, email: USER_EMAIL, jti },
      process.env.JWT_REFRESH_SECRET!,
      { expiresIn: '7d' },
    )
  }

  it('émet de nouveaux tokens si le jti existe en base', async () => {
    const jti = 'bbbbbbbb-0000-0000-0000-000000000002'
    const token = makeRefreshToken(jti)

    mockQuery
      .mockResolvedValueOnce({ rowCount: 1 })  // DELETE old jti
      .mockResolvedValueOnce({ rows: [] })     // INSERT new jti

    const result = await refreshTokens(token)

    expect(result.accessToken).toBeTypeOf('string')
    expect(result.refreshToken).toBeTypeOf('string')
    // Le nouveau refresh token doit contenir un jti différent
    const decoded = jwt.decode(result.refreshToken) as { jti: string }
    expect(decoded.jti).not.toBe(jti)
  })

  it('lance INVALID_TOKEN si le JWT est invalide', async () => {
    await expect(refreshTokens('token.invalide.ici')).rejects.toThrow('INVALID_TOKEN')
  })

  it('lance INVALID_TOKEN si le jti est absent de la base (révoqué)', async () => {
    const token = makeRefreshToken('cccccccc-0000-0000-0000-000000000003')
    mockQuery.mockResolvedValueOnce({ rowCount: 0 })

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
      { expiresIn: '7d' },
    )
    mockQuery.mockResolvedValueOnce({ rows: [] })

    await logoutUser(token)

    expect(mockQuery).toHaveBeenCalledWith('DELETE FROM refresh_tokens WHERE id = $1', [jti])
  })

  it("ne lance pas d'erreur si le token est invalide (révoqué ou expiré)", async () => {
    await expect(logoutUser('token.invalide')).resolves.toBeUndefined()
    expect(mockQuery).not.toHaveBeenCalled()
  })
})
