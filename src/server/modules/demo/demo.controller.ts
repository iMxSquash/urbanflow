import type { Request, Response } from 'express'
import * as demoService from './demo.service.js'
import type { UpdateDemoModeInput } from './demo.service.js'

export function getMode(_req: Request, res: Response): void {
  res.json(demoService.getDemoModeState())
}

export function patchMode(req: Request, res: Response): void {
  const input = req.body as UpdateDemoModeInput
  res.json(demoService.updateDemoMode(input))
}
