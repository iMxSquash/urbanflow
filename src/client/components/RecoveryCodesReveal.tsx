import { useEffect, useState } from 'react'

interface RecoveryCodesRevealProps {
  codes: string[]
  heading: string
  description: string
  confirmLabel: string
  continueLabel: string
  onContinue: () => void
}

/** Affichage unique des codes de récupération (inscription, régénération, remplacement
 * après usage) — jamais relisibles ensuite côté serveur. Téléchargement/copie + case de
 * confirmation obligatoire avant de continuer, à l'image de GitHub. */
export function RecoveryCodesReveal({
  codes,
  heading,
  description,
  confirmLabel,
  continueLabel,
  onContinue,
}: RecoveryCodesRevealProps) {
  const [confirmed, setConfirmed] = useState(false)
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'error'>('idle')

  // Ces codes ne sont jamais réaffichables — un rechargement/fermeture avant
  // confirmation les perdrait définitivement alors que le compte/le jeu de
  // codes est déjà actif côté serveur.
  useEffect(() => {
    if (confirmed) return
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault()
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [confirmed])

  function handleDownload() {
    const blob = new Blob([codes.join('\n') + '\n'], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'urbanflow-codes-recuperation.txt'
    link.click()
    URL.revokeObjectURL(url)
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(codes.join('\n'))
      setCopyStatus('copied')
    } catch {
      setCopyStatus('error')
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-h3 font-bold mb-1">{heading}</h2>
        <p className="text-body-sm text-text-muted leading-relaxed">{description}</p>
      </div>

      <ul
        aria-label="Codes de récupération"
        className="grid grid-cols-1 gap-1.5 p-3.5 rounded-md bg-surface-sunken xs:grid-cols-2"
      >
        {codes.map((code) => (
          <li key={code}>
            <code className="text-body-sm font-bold font-mono tracking-wider">{code}</code>
          </li>
        ))}
      </ul>

      <div className="flex gap-2">
        <button type="button" onClick={handleDownload} className="btn-secondary flex-1">
          Télécharger
        </button>
        <button type="button" onClick={() => void handleCopy()} className="btn-secondary flex-1">
          {copyStatus === 'copied'
            ? 'Copié !'
            : copyStatus === 'error'
              ? 'Échec — réessayer'
              : 'Copier'}
        </button>
      </div>
      <div role="status" aria-live="polite" className="sr-only">
        {copyStatus === 'copied' && 'Codes copiés dans le presse-papiers'}
        {copyStatus === 'error' && 'Échec de la copie — utilisez le téléchargement'}
      </div>

      <label className="flex items-start gap-2.5 cursor-pointer text-body-sm text-text">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
          className="size-5.5 rounded-xs accent-primary shrink-0 mt-0.5"
        />
        <span>{confirmLabel}</span>
      </label>

      <button
        type="button"
        onClick={onContinue}
        disabled={!confirmed}
        className="btn-primary w-full disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {continueLabel}
      </button>
    </div>
  )
}
