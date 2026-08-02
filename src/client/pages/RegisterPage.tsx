import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { register } from '../services/auth.service'
import { useAuthStore } from '../stores/auth.store'
import { AuthShell, AuthFooterNotice } from '../components/AuthShell'

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
  const continueAsGuest = useAuthStore((s) => s.continueAsGuest)

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
      navigate('/onboarding')
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

  function handleContinueAsGuest() {
    continueAsGuest()
    navigate('/')
  }

  return (
    <AuthShell active="register">
      <div role="alert" aria-atomic="true">
        {apiError && (
          <div className="bg-danger-surface rounded-md px-4 py-3 mb-2 text-danger-text text-body-sm">
            {apiError}
          </div>
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        aria-label="Formulaire d'inscription"
        noValidate
        className="flex flex-col gap-4"
      >
        <div>
          <label htmlFor="register-email" className="label">
            Adresse email
            <span aria-hidden="true" className="text-danger-text ml-1">
              *
            </span>
          </label>
          <input
            id="register-email"
            type="email"
            autoComplete="email"
            className={`input ${fieldErrors.email ? 'border-danger focus-visible:ring-danger' : ''}`}
            value={email}
            onChange={(e) => handleEmailChange(e.target.value)}
            aria-required="true"
            aria-invalid={!!fieldErrors.email}
            aria-describedby="register-email-error"
            disabled={isLoading}
          />
          <div id="register-email-error" aria-live="polite" aria-atomic="true" className="mt-1.5 min-h-5">
            {fieldErrors.email && <p className="text-body-sm text-danger-text">{fieldErrors.email}</p>}
          </div>
        </div>

        <div>
          <label htmlFor="register-password" className="label">
            Mot de passe
            <span aria-hidden="true" className="text-danger-text ml-1">
              *
            </span>
          </label>
          <input
            id="register-password"
            type="password"
            autoComplete="new-password"
            className={`input ${fieldErrors.password ? 'border-danger focus-visible:ring-danger' : ''}`}
            value={password}
            onChange={(e) => handlePasswordChange(e.target.value)}
            aria-required="true"
            aria-invalid={!!fieldErrors.password}
            aria-describedby="register-password-hint register-password-error"
            disabled={isLoading}
          />
          <p id="register-password-hint" className="mt-1 text-caption text-text-muted">
            8 caractères minimum, 1 majuscule, 1 chiffre
          </p>
          <div id="register-password-error" aria-live="polite" aria-atomic="true" className="mt-1 min-h-5">
            {fieldErrors.password && <p className="text-body-sm text-danger-text">{fieldErrors.password}</p>}
          </div>
        </div>

        <div>
          <label htmlFor="register-confirm" className="label">
            Confirmer le mot de passe
            <span aria-hidden="true" className="text-danger-text ml-1">
              *
            </span>
          </label>
          <input
            id="register-confirm"
            type="password"
            autoComplete="new-password"
            className={`input ${fieldErrors.confirm ? 'border-danger focus-visible:ring-danger' : ''}`}
            value={confirm}
            onChange={(e) => handleConfirmChange(e.target.value)}
            aria-required="true"
            aria-invalid={!!fieldErrors.confirm}
            aria-describedby="register-confirm-error"
            disabled={isLoading}
          />
          <div id="register-confirm-error" aria-live="polite" aria-atomic="true" className="mt-1.5 min-h-5">
            {fieldErrors.confirm && <p className="text-body-sm text-danger-text">{fieldErrors.confirm}</p>}
          </div>
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
              <span>Inscription en cours…</span>
            </>
          ) : (
            'Créer mon compte'
          )}
        </button>
      </form>

      <p className="text-center text-caption text-text-muted -mt-2">
        <span aria-hidden="true">* </span>Champs obligatoires
      </p>

      <AuthFooterNotice onContinueAsGuest={handleContinueAsGuest} />
    </AuthShell>
  )
}
