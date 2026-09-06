import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import type { Server } from 'http'

vi.mock('./db/pool.js', () => ({
  pool: { query: vi.fn(), connect: vi.fn() },
}))

import { app } from './app.js'

// Render sonde `healthCheckPath` (render.yaml) en continu ; s'il partage le
// quota du rate limiter global avec le reste de l'API (bug du 06/09/2026), le
// endpoint fini par renvoyer 429 et Render redémarre l'instance en boucle.
describe('/health rate limiting', () => {
  let server: Server
  let baseUrl: string

  beforeAll(async () => {
    server = await new Promise<Server>((resolve) => {
      const s = app.listen(0, () => resolve(s))
    })
    const { port } = server.address() as { port: number }
    baseUrl = `http://127.0.0.1:${port}`
  })

  afterAll(() => {
    server.close()
  })

  it('never rate-limits /health, even past the global 100 req/15min quota', async () => {
    const requestCount = 110
    const responses = await Promise.all(
      Array.from({ length: requestCount }, () => fetch(`${baseUrl}/health`)),
    )

    for (const res of responses) {
      expect(res.status).toBe(200)
    }
  })
})
