import 'dotenv/config'

const REQUIRED_ENV = ['JWT_SECRET', 'JWT_REFRESH_SECRET'] as const
for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    console.error(`[server] Variable d'environnement manquante : ${key}`)
    process.exit(1)
  }
}

import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import rateLimit from 'express-rate-limit'
import cookieParser from 'cookie-parser'
import swaggerUi from 'swagger-ui-express'
import { runMigrations } from './db/migrate.js'
import { swaggerSpec } from './config/swagger.js'
import authRouter from './modules/auth/index.js'
import profileRouter from './modules/profile/index.js'
import transportRouter from './modules/transport/index.js'
import routingRouter from './modules/routing/index.js'
import gamificationRouter from './modules/gamification/index.js'
import demoRouter from './modules/demo/demo.routes.js'

const app = express()
const PORT = process.env.PORT ?? 3000

app.set('trust proxy', 1)

const globalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Trop de requêtes, réessayez plus tard' },
})

app.use(helmet())
app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }))
app.use(globalRateLimit)
app.use(express.json())
app.use(cookieParser())

if (process.env.NODE_ENV === 'development') {
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))
}
app.use('/api/auth', authRouter)
app.use('/api/profile', profileRouter)
app.use('/api/transport', transportRouter)
app.use('/api/routing', routingRouter)
app.use('/api/gamification', gamificationRouter)
if (process.env.NODE_ENV !== 'production' || process.env.DEMO_MODE) {
  app.use('/api/demo', demoRouter)
}

app.get(['/health', '/api/health'], (_req, res) => {
  res.json({ status: 'ok' })
})

async function start(): Promise<void> {
  try {
    await runMigrations()
  } catch (err) {
    console.warn('[server] DB indisponible, migrations ignorées :', (err as Error).message)
    if (process.env.NODE_ENV === 'production') {
      process.exit(1)
    }
  }

  app.listen(PORT, () => {
    console.log(`[server] http://localhost:${PORT}`)
  })
}

start().catch((err) => {
  console.error(err)
  process.exit(1)
})
