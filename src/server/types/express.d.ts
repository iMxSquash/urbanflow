import type { AuthTokenPayload } from '../modules/auth/auth.types.js'

declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthTokenPayload
  }
}
