export class AuthError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly clientMessage: string,
    options?: ErrorOptions
  ) {
    super(message, options)
    this.name = new.target.name
  }
}

export class EmailExistsError extends AuthError {
  constructor(cause?: unknown) {
    super('EMAIL_EXISTS', 409, 'Cet email est déjà utilisé', { cause })
  }
}

export class InvalidCredentialsError extends AuthError {
  constructor() {
    super('INVALID_CREDENTIALS', 401, 'Identifiants incorrects')
  }
}

export class InvalidTokenError extends AuthError {
  constructor() {
    super('INVALID_TOKEN', 401, 'Token invalide ou expiré')
  }
}

export class UserNotFoundError extends AuthError {
  constructor() {
    super('USER_NOT_FOUND', 404, 'Utilisateur introuvable')
  }
}
