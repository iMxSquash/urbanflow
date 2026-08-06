import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Modal } from './Modal'
import { deleteAccount, exportUserData } from '../services/auth.service'
import { getDashboardStats, getUserBadges } from '../services/gamification.service'
import { getMyRedemptions } from '../services/rewards.service'
import { useAuthStore } from '../stores/auth.store'
import { useProfileStore } from '../stores/profile.store'

const CONFIRM_WORD = 'SUPPRIMER'

interface Inventory {
  tripCount: number
  totalPoints: number
  badgeCount: number
  redemptionCount: number
}

interface DeleteAccountModalProps {
  onClose: () => void
}

export function DeleteAccountModal({ onClose }: DeleteAccountModalProps) {
  const navigate = useNavigate()
  const clearAuth = useAuthStore((s) => s.clearAuth)
  const clearProfile = useProfileStore((s) => s.clearProfile)

  const [inventory, setInventory] = useState<Inventory | null>(null)
  const [confirmText, setConfirmText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isExporting, setIsExporting] = useState(false)

  useEffect(() => {
    Promise.all([getDashboardStats(), getUserBadges(), getMyRedemptions()])
      .then(([stats, badges, redemptions]) => {
        setInventory({
          tripCount: stats.summary.tripCount,
          totalPoints: stats.summary.totalPoints,
          badgeCount: badges.filter((b) => b.unlocked).length,
          redemptionCount: redemptions.length,
        })
      })
      .catch(() => {
        /* inventaire non bloquant — la suppression reste possible sans lui */
      })
  }, [])

  async function handleDelete() {
    setIsDeleting(true)
    setError(null)
    try {
      await deleteAccount()
      clearProfile()
      clearAuth()
      navigate('/login', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible de supprimer le compte')
      setIsDeleting(false)
    }
  }

  async function handleExport() {
    setIsExporting(true)
    try {
      await exportUserData()
    } catch {
      /* non bloquant — l'utilisateur peut réessayer depuis Paramètres */
    } finally {
      setIsExporting(false)
    }
  }

  const canConfirm = confirmText === CONFIRM_WORD

  return (
    <Modal titleId="delete-title" descriptionId="delete-desc" onClose={onClose}>
      <div
        className="w-13 h-13 bg-danger-surface-icon rounded-xl flex items-center justify-center mb-4"
        aria-hidden="true"
      >
        <svg
          width="26"
          height="26"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-danger"
        >
          <path d="M4 7h16M9 7V5a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 5v2M6 7l1 13a1.5 1.5 0 0 0 1.5 1.4h7A1.5 1.5 0 0 0 17 20l1-13M10 11v6M14 11v6" />
        </svg>
      </div>

      <h2 id="delete-title" className="text-h3 font-bold mb-2">
        Supprimer définitivement votre compte ?
      </h2>
      <p id="delete-desc" className="text-body-sm text-text-muted leading-relaxed mb-1">
        Cette action est irréversible et prend effet immédiatement.
      </p>
      <button
        type="button"
        onClick={() => void handleExport()}
        disabled={isExporting}
        className="text-body-sm font-semibold text-primary mb-3 disabled:opacity-50 self-start"
      >
        {isExporting ? 'Export en cours…' : 'Exporter vos données avant de continuer'}
      </button>

      <ul className="flex flex-col gap-1.5 p-3 rounded-md bg-danger-surface mb-4">
        {inventory ? (
          <>
            <li className="flex items-start gap-2 text-body-sm text-danger-text-muted">
              <IconCross />
              {inventory.tripCount} trajet{inventory.tripCount > 1 ? 's' : ''} et leur historique
            </li>
            <li className="flex items-start gap-2 text-body-sm text-danger-text-muted">
              <IconCross />
              {inventory.totalPoints} points et {inventory.badgeCount} badge
              {inventory.badgeCount > 1 ? 's' : ''}
            </li>
            {inventory.redemptionCount > 0 && (
              <li className="flex items-start gap-2 text-body-sm text-danger-text-muted">
                <IconCross />
                {inventory.redemptionCount} récompense{inventory.redemptionCount > 1 ? 's' : ''}{' '}
                échangée
                {inventory.redemptionCount > 1 ? 's' : ''}
              </li>
            )}
          </>
        ) : (
          <li className="text-body-sm text-danger-text-muted">Chargement de l'inventaire…</li>
        )}
      </ul>

      <div className="flex flex-col gap-1.5 mb-4">
        <label htmlFor="delete-confirm" className="text-body-sm font-semibold text-text-muted">
          Saisissez <b className="text-text">{CONFIRM_WORD}</b> pour confirmer
        </label>
        <input
          id="delete-confirm"
          type="text"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          className="input border-danger focus-visible:ring-danger"
          autoComplete="off"
          aria-describedby="delete-confirm-hint"
        />
        <span id="delete-confirm-hint" className="sr-only">
          Le bouton de suppression ne s'active qu'après saisie exacte de {CONFIRM_WORD}
        </span>
      </div>

      {error && (
        <p role="alert" className="text-body-sm text-danger-text mb-3">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={() => void handleDelete()}
          disabled={!canConfirm || isDeleting}
          aria-busy={isDeleting}
          className="h-13 w-full justify-center rounded-lg bg-danger text-on-primary text-body font-bold disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isDeleting ? 'Suppression…' : 'Supprimer définitivement'}
        </button>
        <button type="button" onClick={onClose} className="btn-secondary w-full">
          Annuler
        </button>
      </div>
    </Modal>
  )
}

function IconCross() {
  return (
    <svg
      aria-hidden="true"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.6"
      strokeLinecap="round"
      className="shrink-0 mt-0.5"
    >
      <path d="M4 4l16 16M20 4L4 20" />
    </svg>
  )
}
