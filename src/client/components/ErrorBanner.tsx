interface ErrorBannerProps {
  message: string
  onRetry?: () => void
  onClose?: () => void
}

export function ErrorBanner({ message, onRetry, onClose }: ErrorBannerProps) {
  return (
    <div
      role="alert"
      className="bg-white rounded-card shadow-card-md border border-red-100 px-4 py-3 flex items-start justify-between gap-3"
    >
      <div className="flex items-center gap-2 text-body-sm text-red-600 min-w-0">
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          className="shrink-0"
          aria-hidden="true"
        >
          <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
          <path
            d="M8 4.5v4M8 10.5v1"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
        <p className="truncate">{message}</p>
      </div>

      {(onRetry || onClose) && (
        <div className="flex items-center gap-2 shrink-0">
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="btn-secondary text-caption px-3"
              style={{ minHeight: '36px' }}
            >
              Réessayer
            </button>
          )}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Fermer le message d'erreur"
              className="btn-ghost text-caption px-3"
              style={{ minHeight: '36px' }}
            >
              Fermer
            </button>
          )}
        </div>
      )}
    </div>
  )
}
