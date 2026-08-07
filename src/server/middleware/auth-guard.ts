import type { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { requireEnv } from '../config/env.js'
import type { AuthTokenPayload } from '../modules/auth/auth.types.js'

export function authGuard(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization

  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Token manquant' })
    return
  }

  const token = header.slice(7)

  try {
    req.user = jwt.verify(token, requireEnv('JWT_SECRET')) as AuthTokenPayload
    next()
  } catch {
    res.status(401).json({ error: 'Token invalide ou expiré' })
  }
}
