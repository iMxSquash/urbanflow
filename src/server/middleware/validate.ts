import type { Request, Response, NextFunction } from 'express'
import type { ZodTypeAny } from 'zod'

function runValidation(
  schema: ZodTypeAny,
  getInput: (req: Request) => unknown,
  onSuccess: (req: Request, data: unknown) => void,
  errorMessage: string
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(getInput(req))
    if (!result.success) {
      res.status(400).json({ error: errorMessage, details: result.error.issues })
      return
    }
    onSuccess(req, result.data)
    next()
  }
}

export function validate(schema: ZodTypeAny) {
  return runValidation(
    schema,
    (req) => req.body,
    (req, data) => {
      req.body = data
    },
    'Données invalides'
  )
}

export function validateQuery(schema: ZodTypeAny) {
  // req.query n'a qu'un getter en Express 5 (accesseur sur IncomingMessage) —
  // le réassigner lève une TypeError au runtime. On stocke le résultat validé
  // à côté (req.validatedQuery) plutôt que d'écraser req.query.
  return runValidation(
    schema,
    (req) => req.query,
    (req, data) => {
      req.validatedQuery = data
    },
    'Paramètres de requête invalides'
  )
}
