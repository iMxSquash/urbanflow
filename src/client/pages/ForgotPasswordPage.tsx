import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { recoverPassword } from '../services/auth.service'
import { AuthShell } from '../components/AuthShell'
import { RecoveryCodesReveal } from '../components/RecoveryCodesReveal'

interface FormErrors {
  email?: string
  recoveryCode?: string
  newPassword?: string
  confirm?: string
}

function validate(
  email: string,
  recoveryCode: string,
  newPassword: string,
  confirm: string
): FormErrors {
  const errors: FormErrors = {}

  if (!email) {
    errors.email = "L'adresse email est requise"
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'Format email invalide'
  }

  if (!recoveryCode) {
    errors.recoveryCode = 'Le code de récupération est requis'
  }

  if (!newPassword) {
    errors.newPassword = 'Le nouveau mot de passe est requis'
  } else if (newPassword.length < 8) {
    errors.newPassword = 'Minimum 8 caractères'
  } else if (!/[A-Z]/.test(newPassword)) {
    errors.newPassword = 'Au moins une majuscule requise'
  } else if (!/[0-9]/.test(newPassword)) {
    errors.newPassword = 'Au moins un chiffre requis'
  }

  if (!confirm) {
    errors.confirm = 'Veuillez confirmer votre nouveau mot de passe'
  } else if (newPassword !== confirm) {
    errors.confirm = 'Les mots de passe ne correspondent pas'
  }

  return errors
}

/** Pas d'envoi d'email — réinitialisation via un des 8 codes de récupération
 * sauvegardés à l'inscription (cf. docs/recherche-mot-de-passe-oublie.md). */
export default function ForgotPasswordPage() {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [recoveryCode, setRecoveryCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({})
  const [apiError, setApiError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [replacementCode, setReplacementCode] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitted(true)
    setApiError(null)

    const errors = validate(email, recoveryCode, newPassword, confirm)
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    setIsLoading(true)
    try {
      const { replacementCode } = await recoverPassword({ email, recoveryCode, newPassword })
      setReplacementCode(replacementCode)
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setIsLoading(false)
    }
  }

  if (replacementCode) {
    return (
      <AuthShell active="recovery">
        <RecoveryCodesReveal
          codes={[replacementCode]}
          heading="Mot de passe changé"
          description="Le code utilisé ne fonctionne plus. Voici son remplaçant — enregistrez-le avec vos 7 autres codes avant de vous connecter."
          confirmLabel="J'ai enregistré mon nouveau code"
          continueLabel="Aller à la connexion"
          onContinue={() => navigate('/login')}
        />
      </AuthShell>
    )
  }

  return (
    <AuthShell active="recovery">
      <div>
        <h1 className="text-h3 font-bold mb-1">Mot de passe oublié</h1>
        <p className="text-body-sm text-text-muted leading-relaxed">
          Utilisez l'un des 8 codes de récupération reçus à l'inscription.
        </p>
      </div>

      <div role="alert" aria-atomic="true">
        {apiError && (
          <div className="bg-danger-surface rounded-md px-4 py-3 mb-2 text-danger-text text-body-sm">
            {apiError}
          </div>
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        aria-label="Formulaire de récupération de mot de passe"
        noValidate
        className="flex flex-col gap-4"
      >
        <div>
          <label htmlFor="recover-email" className="label">
            Adresse email
          </label>
          <input
            id="recover-email"
            type="email"
            autoComplete="email"
            className={`input ${fieldErrors.email ? 'border-danger focus-visible:ring-danger' : ''}`}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              if (submitted)
                setFieldErrors(validate(e.target.value, recoveryCode, newPassword, confirm))
            }}
            aria-required="true"
            aria-invalid={!!fieldErrors.email}
            aria-describedby="recover-email-error"
            disabled={isLoading}
          />
          <div
            id="recover-email-error"
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
          <label htmlFor="recover-code" className="label">
            Code de récupération
          </label>
          <input
            id="recover-code"
            type="text"
            autoComplete="off"
            placeholder="XXXX-XXXX-XXXX-XXXX"
            className={`input font-mono ${fieldErrors.recoveryCode ? 'border-danger focus-visible:ring-danger' : ''}`}
            value={recoveryCode}
            onChange={(e) => {
              setRecoveryCode(e.target.value)
              if (submitted) setFieldErrors(validate(email, e.target.value, newPassword, confirm))
            }}
            aria-required="true"
            aria-invalid={!!fieldErrors.recoveryCode}
            aria-describedby="recover-code-error"
            disabled={isLoading}
          />
          <div
            id="recover-code-error"
            aria-live="polite"
            aria-atomic="true"
            className="mt-1.5 min-h-5"
          >
            {fieldErrors.recoveryCode && (
              <p className="text-body-sm text-danger-text">{fieldErrors.recoveryCode}</p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="recover-new-password" className="label">
            Nouveau mot de passe
          </label>
          <input
            id="recover-new-password"
            type="password"
            autoComplete="new-password"
            className={`input ${fieldErrors.newPassword ? 'border-danger focus-visible:ring-danger' : ''}`}
            value={newPassword}
            onChange={(e) => {
              setNewPassword(e.target.value)
              if (submitted) setFieldErrors(validate(email, recoveryCode, e.target.value, confirm))
            }}
            aria-required="true"
            aria-invalid={!!fieldErrors.newPassword}
            aria-describedby="recover-new-password-hint recover-new-password-error"
            disabled={isLoading}
          />
          <p id="recover-new-password-hint" className="mt-1 text-caption text-text-muted">
            8 caractères minimum, 1 majuscule, 1 chiffre
          </p>
          <div
            id="recover-new-password-error"
            aria-live="polite"
            aria-atomic="true"
            className="mt-1 min-h-5"
          >
            {fieldErrors.newPassword && (
              <p className="text-body-sm text-danger-text">{fieldErrors.newPassword}</p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="recover-confirm" className="label">
            Confirmer le nouveau mot de passe
          </label>
          <input
            id="recover-confirm"
            type="password"
            autoComplete="new-password"
            className={`input ${fieldErrors.confirm ? 'border-danger focus-visible:ring-danger' : ''}`}
            value={confirm}
            onChange={(e) => {
              setConfirm(e.target.value)
              if (submitted)
                setFieldErrors(validate(email, recoveryCode, newPassword, e.target.value))
            }}
            aria-required="true"
            aria-invalid={!!fieldErrors.confirm}
            aria-describedby="recover-confirm-error"
            disabled={isLoading}
          />
          <div
            id="recover-confirm-error"
            aria-live="polite"
            aria-atomic="true"
            className="mt-1.5 min-h-5"
          >
            {fieldErrors.confirm && (
              <p className="text-body-sm text-danger-text">{fieldErrors.confirm}</p>
            )}
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
              <span>Vérification…</span>
            </>
          ) : (
            'Changer mon mot de passe'
          )}
        </button>
      </form>
    </AuthShell>
  )
}
