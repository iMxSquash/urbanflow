import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'

interface LegalPageLayoutProps {
  title: string
  children: ReactNode
}

/** Mise en page partagée par les 3 pages légales (Mentions légales, CGU,
 * Politique de confidentialité). `navigate(-1)` plutôt qu'un `Link` fixe : ces
 * pages sont publiques et atteignables aussi bien depuis l'écran de connexion
 * (non authentifié) que depuis Paramètres (authentifié). */
export function LegalPageLayout({ title, children }: LegalPageLayoutProps) {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-bg">
      <header className="bg-surface border-b border-border sticky top-0 z-navbar">
        <div className="max-w-2xl mx-auto flex items-center gap-3 px-4 h-16">
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label="Retour"
            className="btn-icon"
          >
            <svg
              aria-hidden="true"
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <h1 className="text-h3 font-bold">{title}</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-5">{children}</main>
    </div>
  )
}

export function LegalSection({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-body font-bold">{heading}</h2>
      <div className="text-body-sm text-text-muted leading-relaxed flex flex-col gap-2">
        {children}
      </div>
    </section>
  )
}
