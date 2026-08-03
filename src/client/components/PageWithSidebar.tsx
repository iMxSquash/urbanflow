import type { ReactNode } from 'react'
import { BottomNav } from './BottomNav'

/** Enveloppe commune aux pages hors carte : bottom nav mobile → sidebar 232px
 * fixe à gauche du contenu dès `lg:` (MAQUETTE.md §7). La sidebar reste figée
 * à la hauteur de l'écran (`lg:h-screen` sur la ligne + colonne dédiée qui
 * scrolle) — sans ça, une page de contenu plus haute que le viewport fait
 * défiler toute la ligne flex, la sidebar disparaissant avec le contenu. */
export function PageWithSidebar({ children }: { children: ReactNode }) {
  return (
    <div className="lg:flex lg:h-screen lg:overflow-hidden">
      <BottomNav />
      <div className="lg:flex-1 lg:min-w-0 lg:h-screen lg:overflow-y-auto">{children}</div>
    </div>
  )
}
