import type { Request, Response } from 'express'
import * as authService from './auth.service.js'
import * as profileService from '../profile/profile.service.js'
import * as gamificationService from '../gamification/gamification.service.js'
import * as rewardsService from '../rewards/rewards.service.js'
import { AuthError } from './auth.errors.js'

const REFRESH_COOKIE = 'refresh_token'

const cookieBase = {
  httpOnly: true,
  secure: true,
  sameSite: 'strict' as const,
  path: '/',
}

const cookieOptions = { ...cookieBase, maxAge: 7 * 24 * 60 * 60 * 1000 }

function handleAuthError(err: unknown, res: Response): void {
  if (err instanceof AuthError) {
    res.status(err.status).json({ error: err.clientMessage })
    return
  }
  res.status(500).json({ error: 'Erreur interne du serveur' })
}

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body as { email: string; password: string }
    const { accessToken, refreshToken } = await authService.registerUser(email, password)
    res.cookie(REFRESH_COOKIE, refreshToken, cookieOptions)
    res.status(201).json({ accessToken })
  } catch (err) {
    handleAuthError(err, res)
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password, rememberMe } = req.body as {
      email: string
      password: string
      rememberMe?: boolean
    }
    const { accessToken, refreshToken } = await authService.loginUser(email, password, !!rememberMe)
    // rememberMe coché : cookie persistant (7j, maxAge). Décoché : cookie de
    // session — le refresh token reste valide 7j côté serveur, mais le
    // navigateur l'efface à la fermeture, donc pas de reconnexion silencieuse.
    res.cookie(REFRESH_COOKIE, refreshToken, rememberMe ? cookieOptions : cookieBase)
    res.status(200).json({ accessToken })
  } catch (err) {
    handleAuthError(err, res)
  }
}

export async function refresh(req: Request, res: Response): Promise<void> {
  const incomingToken = req.cookies?.[REFRESH_COOKIE] as string | undefined
  if (!incomingToken) {
    res.status(401).json({ error: 'Token de rafraîchissement manquant' })
    return
  }
  try {
    const { accessToken, refreshToken, rememberMe } = await authService.refreshTokens(incomingToken)
    // Repose le même type de cookie que celui posé au login (persistant vs
    // session) — rememberMe est reporté par le service à travers la rotation,
    // sinon un cookie de session serait remplacé par un cookie persistant (ou
    // l'inverse) dès le premier refresh.
    res.cookie(REFRESH_COOKIE, refreshToken, rememberMe ? cookieOptions : cookieBase)
    res.status(200).json({ accessToken })
  } catch (err) {
    handleAuthError(err, res)
  }
}

export async function deleteAccount(req: Request, res: Response): Promise<void> {
  try {
    await authService.deleteAccount(req.user!.sub)
    res.clearCookie(REFRESH_COOKIE, cookieBase)
    res.status(204).send()
  } catch (err) {
    handleAuthError(err, res)
  }
}

// Droit à la portabilité (RGPD art. 20) : export JSON machine-readable de
// l'ensemble des données personnelles liées au compte connecté.
export async function exportData(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.sub
    const [account, profile, trips, badges, redemptions] = await Promise.all([
      authService.getAccountInfo(userId),
      profileService.getProfile(userId),
      gamificationService.getUserTrips(userId),
      gamificationService.getUserBadges(userId),
      rewardsService.getUserRedemptions(userId),
    ])

    res.setHeader('Content-Disposition', 'attachment; filename="urbanflow-donnees.json"')
    res.status(200).json({
      exportedAt: new Date().toISOString(),
      account,
      mobilityProfile: profile,
      trips,
      badges: badges.filter((b) => b.unlocked),
      rewardRedemptions: redemptions,
    })
  } catch (err) {
    handleAuthError(err, res)
  }
}

export async function recordConsent(req: Request, res: Response): Promise<void> {
  try {
    await authService.recordRgpdConsent(req.user!.sub)
    res.status(204).send()
  } catch (err) {
    handleAuthError(err, res)
  }
}

export async function logout(req: Request, res: Response): Promise<void> {
  const incomingToken = req.cookies?.[REFRESH_COOKIE] as string | undefined
  if (incomingToken) {
    await authService.logoutUser(incomingToken)
  }
  res.clearCookie(REFRESH_COOKIE, cookieBase)
  res.status(204).send()
}
