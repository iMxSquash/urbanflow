import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { login } from '../services/auth.service'
import { useAuthStore } from '../stores/auth.store'
import { UrbanFlowLogo } from '../components/UrbanFlowLogo'

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

function InputDot() {
  return (
    <span
      className="absolute left-3 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-accent-eco shrink-0 pointer-events-none"
      aria-hidden="true"
    />
  )
}

export default function LoginPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
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

  return (
    <main className="min-h-screen bg-bg-base flex flex-col px-6 pt-14 pb-10">
      <div className="w-full max-w-sm mx-auto flex flex-col">

        {/* Logo */}
        <div className="flex justify-center mb-10">
          <UrbanFlowLogo />
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-h1 font-bold text-text-primary">Bon retour !</h1>
          <p className="mt-1 text-body-sm text-text-secondary">Connectez-vous pour continuer</p>
        </div>

        {/* API error */}
        <div role="alert" aria-atomic="true">
          {apiError && (
            <div className="rounded-input px-4 py-3 mb-4 text-body-sm bg-bg-elevated border border-accent-error text-accent-error">
              {apiError}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} aria-label="Formulaire de connexion" noValidate>
          {/* Email */}
          <div className="mb-4">
            <label htmlFor="login-email" className="label">
              Email
            </label>
            <div className="relative">
              <InputDot />
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                className={`input pl-10 ${fieldErrors.email ? 'border-accent-error focus:ring-accent-error' : ''}`}
                value={email}
                onChange={(e) => handleEmailChange(e.target.value)}
                aria-required="true"
                aria-invalid={!!fieldErrors.email}
                aria-describedby="login-email-error"
                disabled={isLoading}
              />
            </div>
            <div id="login-email-error" aria-live="polite" aria-atomic="true" className="mt-1.5 min-h-5">
              {fieldErrors.email && (
                <p className="text-body-sm text-accent-error">{fieldErrors.email}</p>
              )}
            </div>
          </div>

          {/* Password */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="login-password" className="label mb-0">
                Mot de passe
              </label>
              <button
                type="button"
                className="text-body-sm text-accent-eco hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-eco focus-visible:rounded-input px-1"
              >
                Oublié ?
              </button>
            </div>
            <div className="relative">
              <InputDot />
              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                className={`input pl-10 ${fieldErrors.password ? 'border-accent-error focus:ring-accent-error' : ''}`}
                value={password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                aria-required="true"
                aria-invalid={!!fieldErrors.password}
                aria-describedby="login-password-error"
                disabled={isLoading}
              />
            </div>
            <div id="login-password-error" aria-live="polite" aria-atomic="true" className="mt-1.5 min-h-5">
              {fieldErrors.password && (
                <p className="text-body-sm text-accent-error">{fieldErrors.password}</p>
              )}
            </div>
          </div>

          {/* Submit */}
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
                  className="inline-block w-4 h-4 border-2 rounded-full animate-spin"
                  style={{
                    borderColor: 'rgba(5,46,22,0.25)',
                    borderTopColor: '#052e16',
                  }}
                />
                <span>Connexion en cours…</span>
              </>
            ) : (
              'Se connecter'
            )}
          </button>
        </form>

        {/* Bottom link */}
        <div className="flex items-center justify-center gap-1 text-body-sm text-text-secondary mt-8">
          Pas encore de compte ?
          <Link
            to="/register"
            className="inline-flex items-center px-1 min-h-[48px] font-medium text-accent-eco underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-eco focus-visible:rounded"
          >
            Créer un compte
          </Link>
        </div>
      </div>
    </main>
  )
}
