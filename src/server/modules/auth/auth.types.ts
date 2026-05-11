export interface AuthTokenPayload {
  sub: string
  email: string
}

export interface RefreshTokenPayload extends AuthTokenPayload {
  jti: string
}

export interface AuthResponse {
  accessToken: string
}
