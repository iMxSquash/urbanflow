---
name: urbanflow-design
description: >
  Design system UrbanFlow SmartRoute. Auto-invoqué quand Claude Code crée
  ou modifie des composants React, des pages ou des éléments UI.
  Encode les tokens, conventions et règles visuelles du projet.
---

# Design System — UrbanFlow SmartRoute

Tu es le garant du design system UrbanFlow. Chaque composant React que tu crées
ou modifies doit respecter ces règles sans exception.

## Identité visuelle

Application de mobilité urbaine éco-responsable. Sobre, utile, accessible.
PAS de design tape-à-l'oeil. PAS d'animations superflues.
La couleur est fonctionnelle, pas décorative.

---

## Tokens couleurs — Classes Tailwind à utiliser

### Actions et états

| Usage | Classe Tailwind |
|-------|----------------|
| Action primaire (CTA) | `bg-eco-600 text-white` |
| Action secondaire | `bg-white border border-slate-200 text-slate-700` |
| Succès / CO2 économisé | `text-eco-700 bg-eco-50` |
| Erreur / CO2 élevé | `text-red-600 bg-red-50` |
| Alerte douce | `text-amber-700 bg-amber-50` |
| Info neutre | `text-sky-700 bg-sky-50` |

### Modes de transport

| Mode | Border / bg tint | Texte |
|------|-----------------|-------|
| Marche | `border-slate-300 bg-slate-50` | `text-slate-600` |
| Vélo | `border-eco-300 bg-eco-50` | `text-eco-700` |
| Tramway | `border-transit-300 bg-transit-50` | `text-transit-700` |
| Bus | `border-amber-300 bg-amber-50` | `text-amber-700` |
| Navibus | `border-cyan-300 bg-cyan-50` | `text-cyan-700` |

### Textes

| Usage | Classe |
|-------|--------|
| Titre principal | `text-slate-900 font-bold` |
| Corps de texte | `text-slate-700` |
| Texte secondaire | `text-slate-500` |
| Metadata / caption | `text-slate-400` |
| Sur fond coloré | `text-white` |

---

## Composants — Patterns obligatoires

### Bouton primaire

```tsx
<button className="btn-primary">
  Texte
</button>
// ou avec Tailwind direct :
<button className="inline-flex items-center justify-center gap-2 px-4 py-3
                   bg-eco-600 text-white font-medium rounded-button
                   hover:bg-eco-700 active:bg-eco-800
                   focus-visible:ring-2 focus-visible:ring-eco-600 focus-visible:ring-offset-2
                   transition-colors duration-fast
                   disabled:opacity-50 disabled:cursor-not-allowed
                   min-h-[48px]">
```

### Carte d'itinéraire

```tsx
<div className="card p-4 border-l-4 border-l-eco-600">
  {/* border-l colorée selon mode principal */}
```

### Input de formulaire

```tsx
<div>
  <label htmlFor="email" className="label">
    Email
  </label>
  <input
    id="email"
    type="email"
    className="input"
    placeholder="votre@email.fr"
  />
</div>
```

JAMAIS un input sans `<label>` associé — violation WCAG directe.

### Badge de mode de transport

```tsx
<span className="mode-badge mode-badge-bike">
  🚲 Vélo
</span>
```

---

## Règles typographiques

- Police : Inter uniquement (`font-sans`)
- Titres de page : `text-h1 font-bold text-slate-900`
- Titres de section : `text-h2 font-semibold text-slate-900`
- Titres de card : `text-h3 font-semibold text-slate-800`
- Corps : `text-body text-slate-700 leading-relaxed`
- Labels formulaire : `text-body-sm font-medium text-slate-700`
- Metadata : `text-caption text-slate-400`
- Chiffre CO2 / stat clé : `text-display font-bold`

---

## Espacement — Règles

- Grille 4px. Toujours utiliser les multiples Tailwind (`p-4` = 16px, `p-6` = 24px)
- Padding interne card : `p-4` (mobile) / `p-6` (desktop)
- Gap entre éléments d'une liste : `gap-3` ou `gap-4`
- Padding horizontal de page : `px-4` (mobile) / `px-6` (desktop)
- Jamais de padding ou margin en valeur absolue CSS (`style={{ padding: '13px' }}`) — utiliser Tailwind

---

## Accessibilité — Non-négociable

Chaque composant DOIT :

1. **Images** : `alt` descriptif sur tout `<img>`. `alt=""` si décorative.
2. **Formulaires** : `<label>` avec `htmlFor` pour chaque input.
3. **Boutons icône** : `aria-label="Description de l'action"`.
4. **États dynamiques** : `aria-live="polite"` sur les zones de feedback.
5. **Focus** : `focus-visible:ring-2 focus-visible:ring-eco-600` sur tout élément interactif.
6. **Couleur** : jamais seule pour transmettre une info — toujours icône + couleur ou texte + couleur.
7. **Zones tactiles** : minimum `min-h-[48px] min-w-[48px]` sur tout bouton/lien.
8. **Carte** : `role="application" aria-label="Carte de mobilité de Nantes"` sur le container Leaflet.

---

## Animations — Règles strictes

Éco-conception : minimum vital uniquement.

✅ Autorisé :
```tsx
className="animate-fade-in"        // opacity 0→1, 150ms
className="animate-slide-up"       // translateY + fade, 200ms
className="animate-badge-unlock"   // scale + fade, 300ms (badges seulement)
className="transition-colors duration-fast"  // hover/focus
```

❌ Interdit :
- `framer-motion` sauf si absolument nécessaire et justifié
- Animations en boucle (`animate-spin`, `animate-bounce` en production)
- Scroll animations
- Parallaxe
- `gsap` avec ScrollTrigger

Toujours inclure :
```tsx
// Dans le composant ou le CSS global
// Respecte prefers-reduced-motion automatiquement via le CSS global
```

---

## Responsive — Mobile-first obligatoire

Structure de classe : `[mobile] sm:[tablette] lg:[desktop]`

```tsx
// ✅ Correct
<div className="px-4 py-6 lg:px-8 lg:py-10">

// ❌ Incorrect
<div className="lg:px-8 px-4">  // ordre inversé
```

Breakpoints projet :
- `xs` (375px) : iPhone SE — cas limite
- `sm` (640px) : tablette portrait
- `md` (768px) : tablette paysage
- `lg` (1024px) : desktop
- `map` (900px) : layout carte desktop

---

## Structure de composant — Template standard

```tsx
import { type FC } from 'react'

interface ComponentNameProps {
  // Props avec types stricts, pas de any
}

export const ComponentName: FC<ComponentNameProps> = ({ prop1, prop2 }) => {
  return (
    <div
      className="..."
      // aria-* si nécessaire
    >
      {/* Contenu */}
    </div>
  )
}
```

- Toujours exporter en named export (pas default)
- Toujours typer les props
- Composant pur : logique dans hooks, pas dans le JSX

---

## Layout de page — Structure commune

```tsx
// Page standard mobile
<div className="min-h-screen bg-slate-50 flex flex-col">
  {/* Navbar fixe */}
  <nav className="h-navbar fixed top-0 inset-x-0 z-navbar bg-white border-b border-slate-200">
  </nav>

  {/* Contenu principal */}
  <main className="flex-1 pt-navbar pb-bottomnav px-4 lg:px-8">
  </main>

  {/* Bottom nav mobile uniquement */}
  <nav className="h-bottomnav fixed bottom-0 inset-x-0 z-navbar bg-white border-t border-slate-200 lg:hidden">
  </nav>
</div>
```

---

## Interdictions formelles

- PAS de couleur hexadécimale en dur dans className (`text-[#16a34a]`) — utiliser les tokens
- PAS de `style={{ color: '...' }}` sauf pour les couleurs de polyline Leaflet
- PAS de tailwind `!important` (`!bg-red-500`) sauf override Leaflet documenté
- PAS de `text-xs` sur du texte fonctionnel (minimum `text-caption` = 12px)
- PAS de marge négative sans commentaire expliquant pourquoi