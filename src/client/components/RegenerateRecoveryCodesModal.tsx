import { useState } from 'react'
import { Modal } from './Modal'
import { RecoveryCodesReveal } from './RecoveryCodesReveal'
import { regenerateRecoveryCodes } from '../services/auth.service'

interface RegenerateRecoveryCodesModalProps {
  onClose: () => void
}

/** Confirmation puis génération d'un nouveau jeu de 8 codes — invalide tous les
 * codes précédents (usés ou non), à l'image de GitHub. */
export function RegenerateRecoveryCodesModal({ onClose }: RegenerateRecoveryCodesModalProps) {
  const [codes, setCodes] = useState<string[] | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleRegenerate() {
    setIsLoading(true)
    setError(null)
    try {
      const { recoveryCodes } = await regenerateRecoveryCodes()
      setCodes(recoveryCodes)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible de régénérer les codes')
      setIsLoading(false)
    }
  }

  if (codes) {
    // Les anciens codes sont déjà invalidés côté serveur à ce stade — Échap ne
    // doit pas pouvoir fermer la modale avant que l'utilisateur ait confirmé
    // avoir enregistré le nouveau jeu, seul moyen de fermer ici (RecoveryCodesReveal
    // n'appelle onContinue qu'une fois la case de confirmation cochée).
    return (
      <Modal titleId="regen-codes-title" onClose={() => {}}>
        <h2 id="regen-codes-title" className="sr-only">
          Nouveaux codes de récupération
        </h2>
        <RecoveryCodesReveal
          codes={codes}
          heading="Nouveaux codes de récupération"
          description="Ces codes remplacent tous vos codes précédents, qui ne fonctionnent plus. Enregistrez-les avant de continuer."
          confirmLabel="J'ai enregistré mes nouveaux codes"
          continueLabel="Terminer"
          onContinue={onClose}
        />
      </Modal>
    )
  }

  return (
    <Modal titleId="regen-confirm-title" descriptionId="regen-confirm-desc" onClose={onClose}>
      <h2 id="regen-confirm-title" className="text-h3 font-bold mb-2">
        Régénérer vos codes de récupération ?
      </h2>
      <p id="regen-confirm-desc" className="text-body-sm text-text-muted leading-relaxed mb-4">
        Vos 8 codes actuels seront immédiatement invalidés et remplacés par un nouveau jeu de 8
        codes.
      </p>

      {error && (
        <p role="alert" className="text-body-sm text-danger-text mb-3">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={() => void handleRegenerate()}
          disabled={isLoading}
          aria-busy={isLoading}
          className="btn-primary w-full disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Génération…' : 'Régénérer mes codes'}
        </button>
        <button type="button" onClick={onClose} className="btn-secondary w-full">
          Annuler
        </button>
      </div>
    </Modal>
  )
}
