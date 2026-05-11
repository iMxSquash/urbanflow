import type { Request, Response, NextFunction } from 'express'
import type { ZodTypeAny } from 'zod'

export function validate(schema: ZodTypeAny) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body)
    if (!result.success) {
      res.status(400).json({ error: 'Données invalides', details: result.error.issues })
      return
    }
    req.body = result.data
    next()
  }
}
