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
 *     summary: Calcule des itinéraires multimodaux entre deux points
 *     description: >
 *       Retourne jusqu'à 5 itinéraires classés par score décroissant (algorithme multicritères
 *       durée × CO2 × confort). Les providers activés dépendent des modes demandés :
 *       bus/tramway/navibus/train → TransitousProvider (api.transitous.org) ;
 *       bike/walk/scooter → OsrmProvider (router.project-osrm.org) ;
 *       DEMO_MODE=true → DemoProvider (JSON statiques, toujours disponible).
 *       Filtres appliqués avant le classement : modes non souhaités éliminés,
 *       segments de marche dépassant maxWalkMinutes supprimés (PMR : seuil réduit à 5 min).
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
 *                 $ref: '#/components/schemas/Coordinates'
 *               to:
 *                 $ref: '#/components/schemas/Coordinates'
 *               datetime:
 *                 type: string
 *                 format: date-time
 *                 description: Heure de départ souhaitée (ISO 8601 avec offset). Défaut = maintenant.
 *                 example: "2026-05-13T08:00:00+02:00"
 *               preference:
 *                 type: string
 *                 enum: [eco, fast, balanced]
 *                 default: balanced
 *                 description: >
 *                   Pondération du scoring — eco (CO2 ×0.7), fast (durée ×0.7), balanced (CO2 ×0.5 durée ×0.4)
 *               preferredModes:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/TransportMode'
 *                 default: []
 *                 description: >
 *                   Modes activés. Tableau vide = Transitous seul (fallback TC).
 *                   TC (bus/tramway/navibus/train) active TransitousProvider ;
 *                   actifs (bike/walk/scooter) active OsrmProvider.
 *                 example: [bus, tramway, walk]
 *               maxWalkMinutes:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 120
 *                 default: 30
 *                 description: Durée max acceptable pour un segment marche. Filtre dur (pas seulement score).
 *                 example: 20
 *               pmrAccessibility:
 *                 type: boolean
 *                 default: false
 *                 description: >
 *                   Si true : maxWalkMinutes effectif réduit à min(maxWalkMinutes, 5),
 *                   vélo et scooter bloqués, pénalités de confort renforcées.
 *     responses:
 *       200:
 *         description: Liste d'itinéraires classés par score décroissant
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 journeys:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Journey'
 *       400:
 *         description: Payload invalide (coordonnées hors bornes, mode inconnu, etc.)
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
 *         description: Tous les providers de routage ont échoué
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
const router = Router()

router.post('/journey', authGuard, validate(journeyRequestSchema), routingController.journey)

export default router
