import { Router } from 'express'
import { authGuard } from '../../middleware/auth-guard.js'
import { validate } from '../../middleware/validate.js'
import { journeyRequestSchema } from './routing.schema.js'
import * as routingController from './routing.controller.js'

/**
 * @swagger
 * tags:
 *   name: Routing
 *   description: Calcul d'itinéraires multimodaux
 */

/**
 * @swagger
 * /api/routing/journey:
 *   post:
 *     summary: Calcule des itinéraires entre deux points
 *     description: >
 *       Retourne une liste d'itinéraires multimodaux entre les coordonnées `from` et `to`.
 *       Le provider utilisé dépend de la variable d'environnement TRANSPORT_PROVIDER
 *       (transitous | demo). Si DEMO_MODE=true, utilise toujours le DemoProvider.
 *     tags: [Routing]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [from, to]
 *             properties:
 *               from:
 *                 type: object
 *                 required: [lat, lng]
 *                 properties:
 *                   lat:
 *                     type: number
 *                     example: 47.218
 *                   lng:
 *                     type: number
 *                     example: -1.553
 *               to:
 *                 type: object
 *                 required: [lat, lng]
 *                 properties:
 *                   lat:
 *                     type: number
 *                     example: 47.253
 *                   lng:
 *                     type: number
 *                     example: -1.550
 *               datetime:
 *                 type: string
 *                 format: date-time
 *                 description: Heure de départ souhaitée (ISO 8601). Défaut = maintenant.
 *                 example: "2026-05-13T08:00:00+02:00"
 *     responses:
 *       200:
 *         description: Liste d'itinéraires calculés
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 journeys:
 *                   type: array
 *                   items:
 *                     type: object
 *       400:
 *         description: Coordonnées invalides
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Token manquant ou invalide
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       502:
 *         description: Service de routage indisponible
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
const router = Router()

router.post('/journey', authGuard, validate(journeyRequestSchema), routingController.journey)

export default router
