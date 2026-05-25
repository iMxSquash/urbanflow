import { Router } from 'express'
import { authGuard } from '../../middleware/auth-guard.js'
import { validate } from '../../middleware/validate.js'
import { recordTripSchema } from './gamification.schema.js'
import * as gamificationController from './gamification.controller.js'

const router = Router()

/**
 * @swagger
 * tags:
 *   name: Gamification
 *   description: Enregistrement de trajets et attribution de points CO2
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     SegmentInput:
 *       type: object
 *       required: [mode, distanceKm]
 *       properties:
 *         mode:
 *           $ref: '#/components/schemas/TransportMode'
 *         distanceKm:
 *           type: number
 *           minimum: 0
 *           example: 4.2
 *     RecordTripInput:
 *       type: object
 *       required: [origin, destination, segments]
 *       properties:
 *         origin:
 *           $ref: '#/components/schemas/Coordinates'
 *         destination:
 *           $ref: '#/components/schemas/Coordinates'
 *         segments:
 *           type: array
 *           minItems: 1
 *           items:
 *             $ref: '#/components/schemas/SegmentInput'
 *     RecordTripResult:
 *       type: object
 *       properties:
 *         tripId:
 *           type: string
 *           format: uuid
 *           example: a1b2c3d4-e5f6-7890-abcd-ef1234567890
 *         co2SavedGrams:
 *           type: integer
 *           description: CO2 économisé vs trajet voiture équivalent (g CO2e)
 *           example: 1230
 *         pointsEarned:
 *           type: integer
 *           description: Points attribués pour ce trajet (1 point par 10 g économisés)
 *           example: 123
 *         totalPoints:
 *           type: integer
 *           description: Total cumulé des points de l'utilisateur
 *           example: 456
 */

/**
 * @swagger
 * /api/gamification/record-trip:
 *   post:
 *     summary: Enregistre un trajet choisi et attribue les points CO2
 *     description: >
 *       Calcule le CO2 économisé par rapport à un trajet voiture équivalent
 *       (facteurs ADEME — Base Empreinte), convertit en points (1 pt / 10 g),
 *       persiste le trajet en BDD et met à jour le total de points de l'utilisateur.
 *       Les valeurs CO2 sont recalculées côté serveur depuis les facteurs ADEME
 *       — les valeurs éventuellement fournies par le client sont ignorées.
 *     tags: [Gamification]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RecordTripInput'
 *           example:
 *             origin:
 *               lat: 47.218
 *               lng: -1.553
 *             destination:
 *               lat: 47.235
 *               lng: -1.510
 *             segments:
 *               - mode: walk
 *                 distanceKm: 0.3
 *               - mode: tramway
 *                 distanceKm: 4.2
 *               - mode: walk
 *                 distanceKm: 0.2
 *     responses:
 *       201:
 *         description: Trajet enregistré avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RecordTripResult'
 *       400:
 *         description: Données invalides (validation Zod)
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
 *       500:
 *         description: Erreur interne du serveur
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  '/record-trip',
  authGuard,
  validate(recordTripSchema),
  gamificationController.recordTrip
)

export default router
