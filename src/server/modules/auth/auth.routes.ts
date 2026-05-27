import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { validate } from '../../middleware/validate.js'
import { authGuard } from '../../middleware/auth-guard.js'
import { registerSchema, loginSchema } from './auth.schema.js'
import * as authController from './auth.controller.js'

// Credentials : 5 req/15min — protège contre le credential stuffing
const credentialsRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  message: { error: 'Trop de tentatives, réessayez dans 15 minutes' },
  standardHeaders: 'draft-8',
  legacyHeaders: false,
})

// Refresh : 60 req/15min — déclenché automatiquement à chaque chargement d'app
const refreshRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  message: { error: 'Trop de requêtes, réessayez plus tard' },
  standardHeaders: 'draft-8',
  legacyHeaders: false,
})

// Suppression compte : 3 req/15min — route destructive, anti-abus si token volé
const deleteAccountRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 3,
  message: { error: 'Trop de tentatives, réessayez plus tard' },
  standardHeaders: 'draft-8',
  legacyHeaders: false,
})

const router = Router()

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Inscription, connexion et gestion des tokens
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Inscription d'un nouvel utilisateur
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: alice@example.com
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 description: Min 8 chars, 1 majuscule, 1 chiffre
 *                 example: Password1
 *     responses:
 *       201:
 *         description: Utilisateur créé — access token retourné, refresh token en cookie HttpOnly
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Données invalides (format email, règles mot de passe)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Email déjà utilisé
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       429:
 *         description: Trop de tentatives (5 req / 15 min par IP)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/register', credentialsRateLimit, validate(registerSchema), authController.register)

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Connexion d'un utilisateur existant
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: alice@example.com
 *               password:
 *                 type: string
 *                 example: Password1
 *     responses:
 *       200:
 *         description: Connexion réussie — access token retourné, refresh token en cookie HttpOnly
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Données invalides
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Identifiants incorrects
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       429:
 *         description: Trop de tentatives (5 req / 15 min par IP)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/login', credentialsRateLimit, validate(loginSchema), authController.login)

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Renouvellement de l'access token via le cookie refresh token
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Nouvel access token émis, refresh token tourné
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Cookie absent, token invalide ou expiré
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/refresh', refreshRateLimit, authController.refresh)

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Déconnexion — révocation du refresh token et suppression du cookie
 *     tags: [Auth]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       204:
 *         description: Déconnexion réussie
 */
router.post('/logout', refreshRateLimit, authController.logout)

/**
 * @swagger
 * /api/auth/me:
 *   delete:
 *     summary: Suppression du compte — droit à l'effacement RGPD
 *     description: >
 *       Supprime définitivement le compte de l'utilisateur connecté ainsi que
 *       toutes ses données associées (profil de mobilité, trajets, badges,
 *       tokens de rafraîchissement) par cascade SQL.
 *       Conformément à l'article 17 du RGPD (droit à l'effacement).
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       204:
 *         description: Compte supprimé avec succès
 *       401:
 *         description: Token manquant ou invalide
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       429:
 *         description: Trop de tentatives (3 req / 15 min par IP)
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
router.delete('/me', deleteAccountRateLimit, authGuard, authController.deleteAccount)

export default router
