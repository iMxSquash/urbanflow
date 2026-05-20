import { Router, type Request, type Response } from 'express'
import { isDemoMode, setDemoMode, getDemoWeather, setDemoWeather } from './demo-config.js'
import { clearWeatherCache } from '../routing/weather.service.js'

const router = Router()

/**
 * @openapi
 * /api/demo/mode:
 *   get:
 *     summary: État du mode démo
 *     tags: [Demo]
 */
router.get('/mode', (_req: Request, res: Response) => {
  res.json({ demoMode: isDemoMode(), weather: getDemoWeather() })
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
 *               weather:
 *                 type: string
 *                 enum: [sunny, rainy]
 */
router.patch('/mode', (req: Request, res: Response) => {
  const { enabled, weather } = req.body as { enabled?: boolean; weather?: string }

  if (typeof enabled === 'boolean') {
    setDemoMode(enabled)
    clearWeatherCache()
    console.log(`[demo] mode démo → ${enabled ? 'activé' : 'désactivé'}`)
  }

  if (weather && ['sunny', 'rainy'].includes(weather)) {
    setDemoWeather(weather as 'sunny' | 'rainy')
    clearWeatherCache()
    console.log(`[demo] météo simulée → ${weather}`)
  }

  res.json({ demoMode: isDemoMode(), weather: getDemoWeather() })
})

export default router
