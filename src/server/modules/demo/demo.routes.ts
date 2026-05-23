import { Router, type Request, type Response } from 'express'
import {
  isWeatherDemoMode,
  isDemoMode,
  setWeatherDemoMode,
  setProvidersDemo,
  getDemoWeather,
  setDemoWeather,
} from './demo-config.js'
import { clearWeatherCache } from '../routing/weather.service.js'
import { authGuard } from '../../middleware/auth-guard.js'
import { validate } from '../../middleware/validate.js'
import { demoPatchSchema } from './demo.schema.js'

const router = Router()

router.use(authGuard)

/**
 * @openapi
 * /api/demo/mode:
 *   get:
 *     summary: État du mode démo
 *     tags: [Demo]
 *     security:
 *       - bearerAuth: []
 */
router.get('/mode', (_req: Request, res: Response) => {
  res.json({
    demoMode: isWeatherDemoMode(),
    providersDemo: isDemoMode(),
    weather: getDemoWeather(),
  })
})

/**
 * @openapi
 * /api/demo/mode:
 *   patch:
 *     summary: Active ou désactive le mode démo à chaud
 *     tags: [Demo]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               enabled:
 *                 type: boolean
 *               providersDemo:
 *                 type: boolean
 *               weather:
 *                 type: string
 *                 enum: [sunny, rainy]
 */
router.patch('/mode', validate(demoPatchSchema), (req: Request, res: Response) => {
  const { enabled, providersDemo, weather } = req.body as {
    enabled?: boolean
    providersDemo?: boolean
    weather?: 'sunny' | 'rainy'
  }

  if (typeof enabled === 'boolean') {
    setWeatherDemoMode(enabled)
    if (!enabled) setProvidersDemo(false)
    clearWeatherCache()
    console.log(`[demo] météo démo → ${enabled ? 'activée' : 'désactivée'}`)
  }

  if (enabled !== false && typeof providersDemo === 'boolean') {
    setProvidersDemo(providersDemo)
    clearWeatherCache()
    console.log(`[demo] providers démo → ${providersDemo ? 'activés' : 'désactivés'}`)
  }

  if (weather) {
    setDemoWeather(weather)
    clearWeatherCache()
    console.log(`[demo] météo simulée → ${weather}`)
  }

  res.json({
    demoMode: isWeatherDemoMode(),
    providersDemo: isDemoMode(),
    weather: getDemoWeather(),
  })
})

export default router
