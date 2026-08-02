import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../services/auth.service'
import { useAuthStore } from '../stores/auth.store'
import { AuthShell, AuthFooterNotice } from '../components/AuthShell'

interface FormErrors {
  email?: string
  password?: string
}

function validate(email: string, password: string): FormErrors {
  const errors: FormErrors = {}

  if (!email) {
    errors.email = "L'adresse email est requise"
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'Format email invalide'
  }

  if (!password) {
    errors.password = 'Le mot de passe est requis'
  }

  return errors
}

export default function LoginPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const continueAsGuest = useAuthStore((s) => s.continueAsGuest)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({})
  const [apiError, setApiError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitted(true)
    setApiError(null)

    const errors = validate(email, password)
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    setIsLoading(true)
    try {
      const { accessToken } = await login({ email, password })
      setAuth(accessToken)
      navigate('/')
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setIsLoading(false)
    }
  }

  function handleEmailChange(v: string) {
    setEmail(v)
    if (submitted) setFieldErrors(validate(v, password))
  }

  function handlePasswordChange(v: string) {
    setPassword(v)
    if (submitted) setFieldErrors(validate(email, v))
  }

  function handleContinueAsGuest() {
    continueAsGuest()
    navigate('/')
  }

  return (
    <AuthShell active="login">
      <div role="alert" aria-atomic="true">
        {apiError && (
          <div className="bg-danger-surface rounded-md px-4 py-3 mb-2 text-danger-text text-body-sm">
            {apiError}
          </div>
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        aria-label="Formulaire de connexion"
        noValidate
        className="flex flex-col gap-4"
      >
        <div>
          <label htmlFor="login-email" className="label">
            Adresse email
          </label>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            className={`input ${fieldErrors.email ? 'border-danger focus-visible:ring-danger' : ''}`}
            value={email}
            onChange={(e) => handleEmailChange(e.target.value)}
            aria-required="true"
            aria-invalid={!!fieldErrors.email}
            aria-describedby="login-email-error"
            disabled={isLoading}
          />
          <div
            id="login-email-error"
            aria-live="polite"
            aria-atomic="true"
            className="mt-1.5 min-h-5"
          >
            {fieldErrors.email && (
              <p className="text-body-sm text-danger-text">{fieldErrors.email}</p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="login-password" className="label">
            Mot de passe
          </label>
          <div className="flex items-center gap-2">
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              className={`input ${fieldErrors.password ? 'border-danger focus-visible:ring-danger' : ''}`}
              value={password}
              onChange={(e) => handlePasswordChange(e.target.value)}
              aria-required="true"
              aria-invalid={!!fieldErrors.password}
              aria-describedby="login-password-error"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="shrink-0 text-caption font-semibold text-primary px-2 h-12"
            >
              {showPassword ? 'Masquer' : 'Afficher'}
            </button>
          </div>
          <div
            id="login-password-error"
            aria-live="polite"
            aria-atomic="true"
            className="mt-1.5 min-h-5"
          >
            {fieldErrors.password && (
              <p className="text-body-sm text-danger-text">{fieldErrors.password}</p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer text-body-sm text-text">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="size-[22px] rounded-xs accent-primary"
            />
            Rester connecté
          </label>
          <a href="#" className="text-body-sm font-semibold text-primary">
            Mot de passe oublié
          </a>
        </div>

        <button
          type="submit"
          className="btn-primary w-full"
          aria-disabled={isLoading}
          aria-busy={isLoading}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <span
                aria-hidden="true"
                className="inline-block w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin"
              />
              <span>Connexion en cours…</span>
            </>
          ) : (
            'Se connecter'
          )}
        </button>
      </form>

      <AuthFooterNotice onContinueAsGuest={handleContinueAsGuest} />
    </AuthShell>
  )
}
