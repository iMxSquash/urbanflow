import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { register } from '../services/auth.service'
import { useAuthStore } from '../stores/auth.store'
import { UrbanFlowLogo } from '../components/UrbanFlowLogo'

interface FormErrors {
  name?: string
  email?: string
  password?: string
}

function getPasswordStrength(password: string): number {
  if (!password) return 0
  let score = 0
  if (password.length >= 8) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  return score + 1
}

const STRENGTH_LABELS = ['', 'Trop court', 'Faible', 'Moyen', 'Fort'] as const
const STRENGTH_TEXT_COLORS = [
  '',
  'text-accent-error',
  'text-accent-warning',
  'text-accent-warning',
  'text-accent-eco',
] as const

function segmentClass(index: number, strength: number): string {
  if (index > strength) return 'bg-border'
  if (strength === 1) return 'bg-accent-error'
  if (strength <= 3) return 'bg-accent-warning'
  return 'bg-accent-eco'
}

function validate(name: string, email: string, password: string): FormErrors {
  const errors: FormErrors = {}

  if (!name.trim()) {
    errors.name = 'Votre nom est requis'
  }

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

export default function RegisterPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({})
  const [apiError, setApiError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const strength = getPasswordStrength(password)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitted(true)
    setApiError(null)

    const errors = validate(name, email, password)
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

  function handleNameChange(v: string) {
    setName(v)
    if (submitted) setFieldErrors(validate(v, email, password))
  }

  function handleEmailChange(v: string) {
    setEmail(v)
    if (submitted) setFieldErrors(validate(name, v, password))
  }

  function handlePasswordChange(v: string) {
    setPassword(v)
    if (submitted) setFieldErrors(validate(name, email, v))
  }

  return (
    <main className="min-h-screen bg-bg-base flex flex-col px-6 pt-14 pb-10">
      <div className="w-full max-w-sm mx-auto flex flex-col">

        {/* Header row: back btn + logo */}
        <div className="flex items-center justify-between mb-10">
          <button
            onClick={() => navigate(-1)}
            aria-label="Retour"
            className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-bg-elevated text-text-secondary hover:bg-bg-card transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-eco"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-5 h-5"
              aria-hidden="true"
            >
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
          </button>
          <UrbanFlowLogo />
          {/* Spacer to visually center the logo */}
          <div className="w-10" aria-hidden="true" />
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-h1 font-bold text-text-primary">Créer votre compte</h1>
          <p className="mt-1 text-body-sm text-text-secondary">
            Rejoignez les éco-voyageurs de Nantes
          </p>
        </div>

        {/* API error */}
        <div role="alert" aria-atomic="true">
          {apiError && (
            <div className="rounded-input px-4 py-3 mb-4 text-body-sm bg-bg-elevated border border-accent-error text-accent-error">
              {apiError}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} aria-label="Formulaire d'inscription" noValidate>
          {/* Nom complet */}
          <div className="mb-4">
            <label htmlFor="register-name" className="label">
              Nom complet
            </label>
            <div className="relative">
              <InputDot />
              <input
                id="register-name"
                type="text"
                autoComplete="name"
                className={`input pl-10 ${fieldErrors.name ? 'border-accent-error focus:ring-accent-error' : ''}`}
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                aria-required="true"
                aria-invalid={!!fieldErrors.name}
                aria-describedby="register-name-error"
                disabled={isLoading}
              />
            </div>
            <div id="register-name-error" aria-live="polite" aria-atomic="true" className="mt-1.5 min-h-5">
              {fieldErrors.name && (
                <p className="text-body-sm text-accent-error">{fieldErrors.name}</p>
              )}
            </div>
          </div>

          {/* Email */}
          <div className="mb-4">
            <label htmlFor="register-email" className="label">
              Email
            </label>
            <div className="relative">
              <InputDot />
              <input
                id="register-email"
                type="email"
                autoComplete="email"
                className={`input pl-10 ${fieldErrors.email ? 'border-accent-error focus:ring-accent-error' : ''}`}
                value={email}
                onChange={(e) => handleEmailChange(e.target.value)}
                aria-required="true"
                aria-invalid={!!fieldErrors.email}
                aria-describedby="register-email-error"
                disabled={isLoading}
              />
            </div>
            <div id="register-email-error" aria-live="polite" aria-atomic="true" className="mt-1.5 min-h-5">
              {fieldErrors.email && (
                <p className="text-body-sm text-accent-error">{fieldErrors.email}</p>
              )}
            </div>
          </div>

          {/* Mot de passe */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="register-password" className="label mb-0">
                Mot de passe
              </label>
              {strength > 0 ? (
                <span
                  className={`text-caption font-medium transition-colors duration-fast ${STRENGTH_TEXT_COLORS[strength]}`}
                  aria-live="polite"
                >
                  {STRENGTH_LABELS[strength]}
                </span>
              ) : (
                <span className="text-caption text-text-muted">min. 8 caractères</span>
              )}
            </div>
            <div className="relative">
              <InputDot />
              <input
                id="register-password"
                type="password"
                autoComplete="new-password"
                className={`input pl-10 ${fieldErrors.password ? 'border-accent-error focus:ring-accent-error' : ''}`}
                value={password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                aria-required="true"
                aria-invalid={!!fieldErrors.password}
                aria-describedby="register-password-strength register-password-error"
                disabled={isLoading}
              />
            </div>
            {/* Strength bar */}
            <div
              id="register-password-strength"
              role="meter"
              aria-label="Force du mot de passe"
              aria-valuenow={strength}
              aria-valuemin={0}
              aria-valuemax={4}
              className="mt-2 flex gap-1"
            >
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-colors duration-normal ${segmentClass(i, strength)}`}
                />
              ))}
            </div>
            <div id="register-password-error" aria-live="polite" aria-atomic="true" className="mt-1.5 min-h-5">
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
                <span>Inscription en cours…</span>
              </>
            ) : (
              'Créer mon compte →'
            )}
          </button>
        </form>

        {/* Bottom link */}
        <div className="flex items-center justify-center gap-1 text-body-sm text-text-secondary mt-8">
          Déjà un compte ?
          <Link
            to="/login"
            className="inline-flex items-center px-1 min-h-[48px] font-medium text-accent-eco underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-eco focus-visible:rounded"
          >
            Se connecter
          </Link>
        </div>
      </div>
    </main>
  )
}
