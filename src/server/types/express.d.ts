import type { AuthTokenPayload } from '../modules/auth/auth.types.js'

declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthTokenPayload
    // req.query n'a pas de setter en Express 5 (accesseur getter-only sur
    // IncomingMessage) — validateQuery() stocke ici le résultat Zod plutôt
    // que de réassigner req.query, ce qui lèverait une TypeError au runtime.
    validatedQuery?: unknown
  }
}
