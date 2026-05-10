import 'dotenv/config'
import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import swaggerUi from 'swagger-ui-express'
import { runMigrations } from './db/migrate.js'
import { swaggerSpec } from './config/swagger.js'
import authRouter from './modules/auth/index.js'

const app = express()
const PORT = process.env.PORT ?? 3000

app.use(helmet())
app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }))
app.use(express.json())
app.use(cookieParser())

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))
app.use('/api/auth', authRouter)

app.get('/health', (_req, res) => {
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
