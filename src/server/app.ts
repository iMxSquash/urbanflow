import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import rateLimit from 'express-rate-limit'
import cookieParser from 'cookie-parser'
import swaggerUi from 'swagger-ui-express'
import { swaggerSpec } from './config/swagger.js'
import authRouter from './modules/auth/index.js'
import profileRouter from './modules/profile/index.js'
import transportRouter from './modules/transport/index.js'
import routingRouter from './modules/routing/index.js'
import gamificationRouter from './modules/gamification/index.js'
import rewardsRouter from './modules/rewards/index.js'
import demoRouter from './modules/demo/demo.routes.js'

export const app = express()

app.set('trust proxy', 1)

const HEALTH_PATHS = new Set(['/health', '/api/health'])

const globalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Trop de requêtes, réessayez plus tard' },
  // Render sonde ce endpoint en continu (healthCheckPath dans render.yaml) — le
  // compter dans le même quota que le reste de l'API le fait passer en 429 dès
  // que le budget est consommé par du trafic réel, ce que Render interprète
  // comme une instance en échec et redémarre (cf. incident du 06/09/2026)
  skip: (req) => HEALTH_PATHS.has(req.path),
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
app.use('/api/rewards', rewardsRouter)
if (process.env.NODE_ENV !== 'production' || process.env.DEMO_MODE) {
  app.use('/api/demo', demoRouter)
}

app.get(['/health', '/api/health'], (_req, res) => {
  res.json({ status: 'ok' })
})
