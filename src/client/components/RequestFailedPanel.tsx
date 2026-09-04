interface RequestFailedPanelProps {
  message: string
}

/** Requête échouée (rate limit, réseau...) — distinct d'un résultat vide
 * légitime (`EmptyResultsPanel`) : pas de suggestions de réglages, qui n'ont
 * aucun rapport avec une requête qui n'a pas abouti. */
export function RequestFailedPanel({ message }: RequestFailedPanelProps) {
  return (
    <div className="flex items-start gap-3">
      <span className="size-11 rounded-md bg-danger-surface flex items-center justify-center shrink-0">
        <svg
          aria-hidden="true"
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-danger"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v5M12 16h.01" />
        </svg>
      </span>
      <span className="flex flex-col gap-1">
        <span className="text-body-lg font-bold">Recherche impossible</span>
        <span className="text-body-sm text-text-muted leading-snug">{message}</span>
      </span>
    </div>
  )
}
