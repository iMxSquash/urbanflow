import { Router } from 'express'
import { authGuard } from '../../middleware/auth-guard.js'
import { validate } from '../../middleware/validate.js'
import { updateProfileSchema } from './profile.schema.js'
import * as profileController from './profile.controller.js'

const router = Router()

/**
 * @swagger
 * tags:
 *   name: Profile
 *   description: Profil de mobilité de l'utilisateur connecté
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     MobilityProfile:
 *       type: object
 *       properties:
 *         userId:
 *           type: string
 *           format: uuid
 *           example: a1b2c3d4-e5f6-7890-abcd-ef1234567890
 *         preferredModes:
 *           type: array
 *           items:
 *             type: string
 *             enum: [walk, bus, tramway, bike, scooter]
 *           example: [walk, tramway, bike]
 *         maxWalkMinutes:
 *           type: integer
 *           minimum: 5
 *           maximum: 60
 *           example: 15
 *         preference:
 *           type: string
 *           enum: [eco, fast, balanced]
 *           example: eco
 *         pmrAccessibility:
 *           type: boolean
 *           description: Filtre les itinéraires selon l'accessibilité PMR
 *           example: false
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: '2026-05-12T10:30:00.000Z'
 *     UpdateProfileInput:
 *       type: object
 *       required: [preferredModes, maxWalkMinutes, preference, pmrAccessibility]
 *       properties:
 *         preferredModes:
 *           type: array
 *           items:
 *             type: string
 *             enum: [walk, bus, tramway, bike, scooter]
 *           minItems: 1
 *           example: [walk, tramway, bike]
 *         maxWalkMinutes:
 *           type: integer
 *           minimum: 5
 *           maximum: 60
 *           example: 15
 *         preference:
 *           type: string
 *           enum: [eco, fast, balanced]
 *           example: eco
 *         pmrAccessibility:
 *           type: boolean
 *           description: Filtre les itinéraires selon l'accessibilité PMR
 *           example: false
 */

/**
 * @swagger
 * /api/profile:
 *   get:
 *     summary: Récupère le profil de mobilité de l'utilisateur connecté
 *     description: >
 *       Retourne les préférences de mobilité enregistrées en BDD.
 *       Si aucun profil n'a encore été sauvegardé, retourne les valeurs par défaut
 *       (modes walk/tramway/bus, 15 min de marche, préférence balanced).
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profil de mobilité (existant ou valeurs par défaut)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MobilityProfile'
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
router.get('/', authGuard, profileController.getProfile)

/**
 * @swagger
 * /api/profile:
 *   put:
 *     summary: Met à jour le profil de mobilité de l'utilisateur connecté
 *     description: >
 *       Crée ou met à jour (upsert) les préférences de mobilité en BDD.
 *       La validation Zod rejette toute entrée invalide (modes inconnus,
 *       maxWalkMinutes hors plage, préférence inconnue).
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateProfileInput'
 *     responses:
 *       200:
 *         description: Profil mis à jour avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MobilityProfile'
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
router.put('/', authGuard, validate(updateProfileSchema), profileController.updateProfile)

export default router
