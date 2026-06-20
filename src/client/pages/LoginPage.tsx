import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { login } from '../services/auth.service'
import { useAuthStore } from '../stores/auth.store'

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
    <main className="min-h-screen bg-bg-base flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-h2 font-bold">Connexion</h1>
          <p className="mt-2 text-body-sm text-text-secondary">
            Accédez à votre espace UrbanFlow
          </p>
        </div>

        <div className="card p-6 md:p-8">
          {/* Zone d'erreur API — toujours dans le DOM pour que aria-live fonctionne */}
          <div role="alert" aria-atomic="true" className="mb-2">
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
                Adresse email
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                className={`input ${fieldErrors.email ? 'border-accent-error focus:ring-accent-error' : ''}`}
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
                  <p className="text-body-sm text-accent-error">
                    {fieldErrors.email}
                  </p>
                )}
              </div>
            </div>

            {/* Mot de passe */}
            <div className="mb-6">
              <label htmlFor="login-password" className="label">
                Mot de passe
              </label>
              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                className={`input ${fieldErrors.password ? 'border-accent-error focus:ring-accent-error' : ''}`}
                value={password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                aria-required="true"
                aria-invalid={!!fieldErrors.password}
                aria-describedby="login-password-error"
                disabled={isLoading}
              />
              <div
                id="login-password-error"
                aria-live="polite"
                aria-atomic="true"
                className="mt-1.5 min-h-5"
              >
                {fieldErrors.password && (
                  <p className="text-body-sm text-accent-error">
                    {fieldErrors.password}
                  </p>
                )}
              </div>
            </div>

            {/* Bouton submit */}
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

          <div className="flex items-center justify-center gap-1 text-body-sm text-text-secondary mt-6">
            Pas encore de compte ?
            <Link
              to="/register"
              className="inline-flex items-center px-1 min-h-[48px] font-medium text-accent-eco underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:rounded"
            >
              Créer un compte
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
