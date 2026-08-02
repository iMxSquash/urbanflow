import type { ReactNode } from 'react'
import { BottomNav } from './BottomNav'

/** Enveloppe commune aux pages hors carte : bottom nav mobile → sidebar 232px
 * fixe à gauche du contenu dès `lg:` (MAQUETTE.md §7). */
export function PageWithSidebar({ children }: { children: ReactNode }) {
  return (
    <div className="lg:flex lg:min-h-screen">
      <BottomNav />
      <div className="lg:flex-1 lg:min-w-0">{children}</div>
    </div>
  )
}
