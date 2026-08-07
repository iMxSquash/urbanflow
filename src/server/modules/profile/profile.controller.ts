import type { Request, Response } from 'express'
import * as profileService from './profile.service.js'
import type { UpdateProfileInput } from './profile.schema.js'

export async function getProfile(req: Request, res: Response): Promise<void> {
  try {
    const profile = await profileService.getProfile(req.user!.sub)
    res.status(200).json(profile)
  } catch (err) {
    console.error('[profile] getProfile error:', err)
    res.status(500).json({ error: 'Erreur interne du serveur' })
  }
}

export async function updateProfile(req: Request, res: Response): Promise<void> {
  try {
    const input = req.body as UpdateProfileInput
    const profile = await profileService.upsertProfile(req.user!.sub, input)
    res.status(200).json(profile)
  } catch (err) {
    console.error('[profile] updateProfile error:', err)
    res.status(500).json({ error: 'Erreur interne du serveur' })
  }
}
