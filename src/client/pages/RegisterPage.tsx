import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { register } from '../services/auth.service'
import { useAuthStore } from '../stores/auth.store'

interface FormErrors {
  email?: string
  password?: string
  confirm?: string
}

function validate(email: string, password: string, confirm: string): FormErrors {
  const errors: FormErrors = {}

  if (!email) {
    errors.email = "L'adresse email est requise"
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'Format email invalide'
  }

  if (!password) {
    errors.password = 'Le mot de passe est requis'
  } else if (password.length < 8) {
    errors.password = 'Minimum 8 caractères'
  } else if (!/[A-Z]/.test(password)) {
    errors.password = 'Au moins une majuscule requise'
  } else if (!/[0-9]/.test(password)) {
    errors.password = 'Au moins un chiffre requis'
  }

  if (!confirm) {
    errors.confirm = 'Veuillez confirmer votre mot de passe'
  } else if (password !== confirm) {
    errors.confirm = 'Les mots de passe ne correspondent pas'
  }

  return errors
}

export default function RegisterPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({})
  const [apiError, setApiError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitted(true)
    setApiError(null)

    const errors = validate(email, password, confirm)
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    setIsLoading(true)
    try {
      const { accessToken } = await register({ email, password })
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
    if (submitted) setFieldErrors(validate(v, password, confirm))
  }

  function handlePasswordChange(v: string) {
    setPassword(v)
    if (submitted) setFieldErrors(validate(email, v, confirm))
  }

  function handleConfirmChange(v: string) {
    setConfirm(v)
    if (submitted) setFieldErrors(validate(email, password, v))
  }

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-h2 font-bold text-slate-900">Créer un compte</h1>
          <p className="mt-2 text-body-sm text-slate-600">Rejoignez UrbanFlow SmartRoute</p>
        </div>

        <div className="card p-6 md:p-8">
          {/* Zone d'erreur API — toujours dans le DOM pour que aria-live fonctionne */}
          <div role="alert" aria-atomic="true" className="mb-2">
            {apiError && (
              <div className="bg-red-50 border border-red-200 rounded-input px-4 py-3 mb-4 text-red-700 text-body-sm">
                {apiError}
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} aria-label="Formulaire d'inscription" noValidate>
            {/* Email */}
            <div className="mb-4">
              <label htmlFor="register-email" className="label">
                Adresse email
                <span aria-hidden="true" className="text-red-600 ml-1">
                  *
                </span>
              </label>
              <input
                id="register-email"
                type="email"
                autoComplete="email"
                className={`input ${fieldErrors.email ? 'border-red-400 focus:ring-red-500' : ''}`}
                value={email}
                onChange={(e) => handleEmailChange(e.target.value)}
                aria-required="true"
                aria-invalid={!!fieldErrors.email}
                aria-describedby="register-email-error"
                disabled={isLoading}
              />
              <div
                id="register-email-error"
                aria-live="polite"
                aria-atomic="true"
                className="mt-1.5 min-h-5"
              >
                {fieldErrors.email && (
                  <p className="text-body-sm text-red-600">{fieldErrors.email}</p>
                )}
              </div>
            </div>

            {/* Mot de passe */}
            <div className="mb-4">
              <label htmlFor="register-password" className="label">
                Mot de passe
                <span aria-hidden="true" className="text-red-600 ml-1">
                  *
                </span>
              </label>
              <input
                id="register-password"
                type="password"
                autoComplete="new-password"
                className={`input ${fieldErrors.password ? 'border-red-400 focus:ring-red-500' : ''}`}
                value={password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                aria-required="true"
                aria-invalid={!!fieldErrors.password}
                aria-describedby="register-password-hint register-password-error"
                disabled={isLoading}
              />
              <p id="register-password-hint" className="mt-1 text-caption text-slate-600">
                8 caractères minimum, 1 majuscule, 1 chiffre
              </p>
              <div
                id="register-password-error"
                aria-live="polite"
                aria-atomic="true"
                className="mt-1 min-h-5"
              >
                {fieldErrors.password && (
                  <p className="text-body-sm text-red-600">{fieldErrors.password}</p>
                )}
              </div>
            </div>

            {/* Confirmation mot de passe */}
            <div className="mb-6">
              <label htmlFor="register-confirm" className="label">
                Confirmer le mot de passe
                <span aria-hidden="true" className="text-red-600 ml-1">
                  *
                </span>
              </label>
              <input
                id="register-confirm"
                type="password"
                autoComplete="new-password"
                className={`input ${fieldErrors.confirm ? 'border-red-400 focus:ring-red-500' : ''}`}
                value={confirm}
                onChange={(e) => handleConfirmChange(e.target.value)}
                aria-required="true"
                aria-invalid={!!fieldErrors.confirm}
                aria-describedby="register-confirm-error"
                disabled={isLoading}
              />
              <div
                id="register-confirm-error"
                aria-live="polite"
                aria-atomic="true"
                className="mt-1.5 min-h-5"
              >
                {fieldErrors.confirm && (
                  <p className="text-body-sm text-red-600">{fieldErrors.confirm}</p>
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
                    className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
                  />
                  <span>Inscription en cours…</span>
                </>
              ) : (
                'Créer mon compte'
              )}
            </button>
          </form>

          <div className="flex items-center justify-center gap-1 text-body-sm text-slate-600 mt-6">
            Déjà un compte ?
            <Link
              to="/login"
              className="inline-flex items-center px-1 min-h-[48px] text-eco-700 font-medium underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eco-600 focus-visible:rounded"
            >
              Se connecter
            </Link>
          </div>
        </div>

        <p className="text-center text-caption text-slate-600 mt-4">
          <span aria-hidden="true">* </span>Champs obligatoires
        </p>
      </div>
    </main>
  )
}
