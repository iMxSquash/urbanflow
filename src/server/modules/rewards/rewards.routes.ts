import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { authGuard } from '../../middleware/auth-guard.js'
import { validate } from '../../middleware/validate.js'
import { purchaseRewardSchema } from './rewards.schema.js'
import * as rewardsController from './rewards.controller.js'

const router = Router()

const purchaseRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: "Trop de demandes d'échange, réessayez dans une heure" },
})

/**
 * @swagger
 * tags:
 *   name: Rewards
 *   description: Boutique de récompenses — échange de points contre des codes de réduction et billets
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     RewardCatalogItem:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *           example: Billet Château des Ducs de Bretagne
 *         description:
 *           type: string
 *         rewardType:
 *           type: string
 *           enum: [discount_code, museum_ticket]
 *         pointsCost:
 *           type: integer
 *           example: 900
 *         partnerName:
 *           type: string
 *           example: Château des Ducs de Bretagne
 *         affordable:
 *           type: boolean
 *           description: true si le solde de points de l'utilisateur couvre le coût
 *     RewardCatalog:
 *       type: object
 *       required: [totalPoints, rewards]
 *       properties:
 *         totalPoints:
 *           type: integer
 *           description: Solde de points actuel de l'utilisateur
 *           example: 530
 *         rewards:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/RewardCatalogItem'
 *     UserRedemption:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         rewardId:
 *           type: string
 *           format: uuid
 *         rewardName:
 *           type: string
 *         rewardType:
 *           type: string
 *           enum: [discount_code, museum_ticket]
 *         partnerName:
 *           type: string
 *         code:
 *           type: string
 *           example: RDM-A1B2C3D4
 *         pointsSpent:
 *           type: integer
 *         redeemedAt:
 *           type: string
 *           format: date-time
 *     PurchaseRewardInput:
 *       type: object
 *       required: [rewardId]
 *       properties:
 *         rewardId:
 *           type: string
 *           format: uuid
 *     PurchaseResult:
 *       type: object
 *       properties:
 *         redemptionId:
 *           type: string
 *           format: uuid
 *         code:
 *           type: string
 *           example: RDM-A1B2C3D4
 *         pointsSpent:
 *           type: integer
 *           example: 900
 *         totalPoints:
 *           type: integer
 *           description: Nouveau solde de points après l'achat
 *           example: 130
 */

/**
 * @swagger
 * /api/rewards/catalog:
 *   get:
 *     summary: Liste les récompenses disponibles avec le solde de points de l'utilisateur
 *     description: >
 *       Retourne le catalogue des récompenses actives (codes de réduction et billets de
 *       musées nantais) ainsi que le solde de points actuel, pour permettre l'affichage
 *       des récompenses accessibles côté client.
 *     tags: [Rewards]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Catalogue des récompenses
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RewardCatalog'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/catalog', authGuard, rewardsController.getCatalog)

/**
 * @swagger
 * /api/rewards/my-redemptions:
 *   get:
 *     summary: Historique des récompenses obtenues par l'utilisateur
 *     description: >
 *       Retourne les échanges effectués par l'utilisateur connecté, du plus récent
 *       au plus ancien, avec le code généré pour chaque récompense.
 *     tags: [Rewards]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Historique des récompenses obtenues
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/UserRedemption'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/my-redemptions', authGuard, rewardsController.getMyRedemptions)

/**
 * @swagger
 * /api/rewards/purchase:
 *   post:
 *     summary: Échange des points contre une récompense du catalogue
 *     description: >
 *       Débite le coût en points du solde de l'utilisateur et génère un code unique
 *       de récompense (format RDM-XXXXXXXX), le tout dans une seule transaction.
 *       Échoue si la récompense n'existe pas, n'est plus active, ou si le solde
 *       de points est insuffisant.
 *     tags: [Rewards]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PurchaseRewardInput'
 *     responses:
 *       201:
 *         description: Récompense échangée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PurchaseResult'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: Récompense introuvable
 *       409:
 *         description: Récompense indisponible ou solde de points insuffisant
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post(
  '/purchase',
  authGuard,
  purchaseRateLimit,
  validate(purchaseRewardSchema),
  rewardsController.purchase
)

export default router
