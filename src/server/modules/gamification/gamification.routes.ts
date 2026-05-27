import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { authGuard } from '../../middleware/auth-guard.js'
import { validate } from '../../middleware/validate.js'
import { recordTripSchema } from './gamification.schema.js'
import * as gamificationController from './gamification.controller.js'

const router = Router()

const recordTripRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Trop de trajets enregistrés, réessayez dans une heure' },
})

/**
 * @swagger
 * tags:
 *   name: Gamification
 *   description: Enregistrement de trajets, points CO2 et badges
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
 *           maximum: 200
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
 *           maxItems: 20
 *           items:
 *             $ref: '#/components/schemas/SegmentInput'
 *         gpsVerified:
 *           type: boolean
 *           default: false
 *           description: >
 *             Indique si le trajet a été suivi par GPS. Si false (ou absent),
 *             0 points sont attribués. Le frontend doit envoyer true uniquement
 *             quand le suivi GPS était actif pendant tout le trajet.
 *     RecordTripResult:
 *       type: object
 *       properties:
 *         tripId:
 *           type: string
 *           format: uuid
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
 *         newlyUnlockedBadges:
 *           type: array
 *           items:
 *             type: string
 *           description: Slugs des badges débloqués lors de ce trajet
 *           example: [premier-trajet, eco-citoyen]
 *     BadgeWithStatus:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *           example: eco-citoyen
 *         description:
 *           type: string
 *           example: 100 g de CO₂ économisés vs voiture
 *         thresholdType:
 *           type: string
 *           example: total_co2_saved_grams
 *         thresholdValue:
 *           type: integer
 *           example: 100
 *         modeFilter:
 *           type: string
 *           nullable: true
 *           example: null
 *         unlocked:
 *           type: boolean
 *         unlockedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *     MonthlySummary:
 *       type: object
 *       required: [co2SavedGrams, tripCount, totalPoints]
 *       properties:
 *         co2SavedGrams:
 *           type: integer
 *           description: CO2 économisé ce mois vs voiture (g CO2e)
 *           example: 4200
 *         tripCount:
 *           type: integer
 *           description: Nombre de trajets enregistrés ce mois
 *           example: 12
 *         totalPoints:
 *           type: integer
 *           description: Total cumulé des points de l'utilisateur
 *           example: 530
 *     WeeklyBar:
 *       type: object
 *       required: [weekStart, co2SavedGrams]
 *       properties:
 *         weekStart:
 *           type: string
 *           format: date
 *           description: Date de début de semaine (YYYY-MM-DD, lundi)
 *           example: '2024-01-08'
 *         co2SavedGrams:
 *           type: integer
 *           description: CO2 économisé sur cette semaine (g CO2e)
 *           example: 980
 *     ModeCount:
 *       type: object
 *       required: [mode, count]
 *       properties:
 *         mode:
 *           $ref: '#/components/schemas/TransportMode'
 *         count:
 *           type: integer
 *           description: Nombre de trajets dont c'est le mode principal
 *           example: 5
 *     DashboardStats:
 *       type: object
 *       required: [period, summary, weeklyCo2, modeBreakdown]
 *       properties:
 *         period:
 *           type: string
 *           enum: [month]
 *         summary:
 *           $ref: '#/components/schemas/MonthlySummary'
 *         weeklyCo2:
 *           type: array
 *           description: Économies CO2 pour les 4 dernières semaines (toujours 4 éléments)
 *           items:
 *             $ref: '#/components/schemas/WeeklyBar'
 *         modeBreakdown:
 *           type: array
 *           description: Répartition par mode principal — la somme des count égale summary.tripCount
 *           items:
 *             $ref: '#/components/schemas/ModeCount'
 */

/**
 * @swagger
 * /api/gamification/record-trip:
 *   post:
 *     summary: Enregistre un trajet et attribue les points CO2
 *     description: >
 *       Calcule le CO2 économisé par rapport à un trajet voiture équivalent
 *       (facteurs ADEME — Base Empreinte), convertit en points (1 pt / 10 g),
 *       persiste le trajet, met à jour les points de l'utilisateur et vérifie
 *       les badges débloquables dans une seule transaction.
 *     tags: [Gamification]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RecordTripInput'
 *     responses:
 *       201:
 *         description: Trajet enregistré avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RecordTripResult'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post(
  '/record-trip',
  authGuard,
  recordTripRateLimit,
  validate(recordTripSchema),
  gamificationController.recordTrip
)

/**
 * @swagger
 * /api/gamification/badges:
 *   get:
 *     summary: Liste tous les badges avec leur statut de déblocage
 *     description: >
 *       Retourne l'ensemble des badges disponibles avec, pour chaque badge,
 *       s'il est débloqué par l'utilisateur connecté et la date de déblocage.
 *       Les badges verrouillés ont unlocked = false et unlockedAt = null.
 *     tags: [Gamification]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des badges
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/BadgeWithStatus'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/badges', authGuard, gamificationController.getBadges)

/**
 * @swagger
 * /api/gamification/stats:
 *   get:
 *     summary: Statistiques personnelles pour le tableau de bord
 *     description: >
 *       Retourne le résumé mensuel (CO2, trajets, points), les économies CO2
 *       semaine par semaine sur les 4 dernières semaines, et la répartition
 *       des modes utilisés ce mois. Seul period=month est supporté.
 *     tags: [Gamification]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         required: true
 *         schema:
 *           type: string
 *           enum: [month]
 *         example: month
 *     responses:
 *       200:
 *         description: Statistiques du tableau de bord
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DashboardStats'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/stats', authGuard, gamificationController.getStats)

export default router
