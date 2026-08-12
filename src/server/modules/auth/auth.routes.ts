import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { validate } from '../../middleware/validate.js'
import { authGuard } from '../../middleware/auth-guard.js'
import { registerSchema, loginSchema, recoverPasswordSchema } from './auth.schema.js'
import * as authController from './auth.controller.js'

function makeAuthRateLimit(limit: number, message: string): ReturnType<typeof rateLimit> {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    limit,
    message: { error: message },
    standardHeaders: 'draft-8',
    legacyHeaders: false,
  })
}

// Credentials : 5 req/15min — protège contre le credential stuffing
const credentialsRateLimit = makeAuthRateLimit(5, 'Trop de tentatives, réessayez dans 15 minutes')

// Refresh : 60 req/15min — déclenché automatiquement à chaque chargement d'app
const refreshRateLimit = makeAuthRateLimit(60, 'Trop de requêtes, réessayez plus tard')

// Suppression compte : 3 req/15min — route destructive, anti-abus si token volé
const deleteAccountRateLimit = makeAuthRateLimit(3, 'Trop de tentatives, réessayez plus tard')

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
 *             required: [email, password, termsAccepted]
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
 *               termsAccepted:
 *                 type: boolean
 *                 enum: [true]
 *                 description: Doit valoir `true` — horodaté côté serveur dans `users.terms_accepted_at`
 *     responses:
 *       201:
 *         description: >
 *           Utilisateur créé — access token retourné, refresh token en cookie HttpOnly,
 *           et 8 codes de récupération à sauvegarder (affichés une seule fois).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RegisterResponse'
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
 *               rememberMe:
 *                 type: boolean
 *                 description: >
 *                   Coché : cookie de refresh persistant (7j). Décoché : cookie de
 *                   session, effacé à la fermeture du navigateur (le token reste
 *                   valide 7j côté serveur, seule la persistance du cookie change).
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

/**
 * @swagger
 * /api/auth/me/export:
 *   get:
 *     summary: Exporte l'ensemble des données personnelles du compte connecté (JSON)
 *     description: >
 *       Droit à la portabilité (RGPD art. 20) : profil de mobilité, historique de
 *       trajets (sans coordonnées GPS), badges débloqués et récompenses échangées.
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Export JSON des données personnelles
 *       401:
 *         description: Token manquant ou invalide
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/me/export', refreshRateLimit, authGuard, authController.exportData)

/**
 * @swagger
 * /api/auth/consent:
 *   post:
 *     summary: Trace le consentement géolocalisation de l'utilisateur connecté
 *     description: >
 *       Enregistre `rgpd_consent_at = now()` côté serveur, en complément du
 *       consentement local (Zustand) affiché par la modale de géolocalisation.
 *       Accountabilité RGPD (art. 5.2) — permet de démontrer que le consentement
 *       a été recueilli.
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       204:
 *         description: Consentement enregistré
 *       401:
 *         description: Token manquant ou invalide
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/consent', refreshRateLimit, authGuard, authController.recordConsent)

/**
 * @swagger
 * /api/auth/password/recover:
 *   post:
 *     summary: Réinitialise le mot de passe via un code de récupération sauvegardé
 *     description: >
 *       Aucun envoi d'email — méthode conforme à NIST SP 800-63B-4 §4.2.1.1
 *       (« Saved Recovery Codes ») pour un compte sans vérification d'identité.
 *       Le code utilisé est invalidé (usage unique) et remplacé par un nouveau ;
 *       toutes les sessions actives de l'utilisateur sont révoquées. L'utilisateur
 *       n'est pas connecté automatiquement — redirection vers /login.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, recoveryCode, newPassword]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: alice@example.com
 *               recoveryCode:
 *                 type: string
 *                 example: XM3K-9PQR-2T7V-4WYZ
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *                 description: Min 8 chars, 1 majuscule, 1 chiffre
 *     responses:
 *       200:
 *         description: Mot de passe changé — nouveau code de remplacement retourné
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 replacementCode:
 *                   type: string
 *                   description: Remplace le code consommé — à sauvegarder immédiatement
 *       400:
 *         description: Données invalides
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: >
 *           Email ou code de récupération invalide — réponse indifférenciée
 *           (anti-énumération de comptes)
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
router.post(
  '/password/recover',
  credentialsRateLimit,
  validate(recoverPasswordSchema),
  authController.recoverPassword
)

/**
 * @swagger
 * /api/auth/recovery-codes/regenerate:
 *   post:
 *     summary: Régénère le jeu de codes de récupération
 *     description: >
 *       Invalide immédiatement tous les codes précédents (utilisés ou non) et en
 *       émet 8 nouveaux, à l'image de GitHub.
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Nouveau jeu de codes généré
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RecoveryCodesResponse'
 *       401:
 *         description: Token manquant ou invalide
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       429:
 *         description: Trop de requêtes (60 req / 15 min par IP)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  '/recovery-codes/regenerate',
  refreshRateLimit,
  authGuard,
  authController.regenerateRecoveryCodes
)

export default router
