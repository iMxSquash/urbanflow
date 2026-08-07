import { Router } from 'express'
import { authGuard } from '../../middleware/auth-guard.js'
import { validate } from '../../middleware/validate.js'
import { demoPatchSchema } from './demo.schema.js'
import * as demoController from './demo.controller.js'

const router = Router()

router.use(authGuard)

/**
 * @swagger
 * /api/demo/mode:
 *   get:
 *     summary: État du mode démo
 *     tags: [Demo]
 *     security:
 *       - bearerAuth: []
 */
router.get('/mode', demoController.getMode)

/**
 * @swagger
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
router.patch('/mode', validate(demoPatchSchema), demoController.patchMode)

export default router
