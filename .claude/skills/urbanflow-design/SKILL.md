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
Thème **Urban Night** (dark) par défaut. Bascule light via `data-theme="light"` sur `<html>`.
PAS de design tape-à-l'oeil. PAS d'animations superflues.
La couleur est fonctionnelle, pas décorative.

---

## Tokens couleurs — Classes Tailwind custom à utiliser

Les couleurs sont des CSS custom properties exposées via `@utility` dans `index.css`.
**Ne jamais écrire de valeur hex en dur** dans les classes Tailwind.

### Surfaces (fond de page et de carte)

| Usage | Classe |
|-------|--------|
| Fond de page profond | `bg-deep` → `var(--color-bg-deep)` |
| Fond de page principal | `bg-base` → `var(--color-bg-base)` |
| Fond élevé (panels, drawers) | `bg-elevated` → `var(--color-bg-elevated)` |
| Fond de carte (card) | `bg-card` → `var(--color-bg-card)` |
| Overlay (modale, backdrop) | `bg-overlay` → `var(--color-overlay)` |

### Textes

| Usage | Classe |
|-------|--------|
| Texte principal | `text-primary-dark` → `var(--color-text-primary)` |
| Texte secondaire | `text-secondary-dark` → `var(--color-text-secondary)` |
| Texte atténué | `text-muted-dark` → `var(--color-text-muted)` |
| Texte désactivé | couleur `--color-text-disabled` (exempt WCAG) |

### Accents

| Usage | Classe |
|-------|--------|
| Action éco (CTA) | `text-eco` / `bg-eco-dim` / `border-eco` |
| Transit / info | `text-transit` |
| Ombre éco | `shadow-eco` |
| Ombre transit | `shadow-transit` |

### Modes de transport — couleurs CSS variables directes

Utiliser via `style={{ color: 'var(--color-mode-bike)' }}` ou dans les composants chip.

| Mode | Variable CSS |
|------|-------------|
| Marche | `--color-mode-walk` (#94A3B8) |
| Vélo / Bicloo | `--color-mode-bike` (#4ADE80) |
| Tramway | `--color-mode-tram` (#818CF8) |
| Bus | `--color-mode-bus` (#FCD34D) |
| Scooter | `--color-mode-scooter` (#22D3EE) |
| Navibus | `--color-mode-navibus` (#38BDF8) |
| Train | `--color-mode-train` (#A78BFA) |

En light mode, utiliser `--color-mode-*-text` pour les textes sur fond clair.

### Sémantique

| Usage | Variable CSS |
|-------|-------------|
| Succès / CO2 économisé | `--color-success` |
| Avertissement | `--color-warning` |
| Erreur (texte) | `--color-error-text` |
| Info (texte) | `--color-info-text` |

---

## Composants — Classes CSS custom (@layer components)

Ces classes sont définies dans `index.css`. Les utiliser directement, pas recréer leur style.

### Bouton primaire

```tsx
<button className="btn-primary">
  Rechercher un itinéraire
</button>
```

### Bouton secondaire

```tsx
<button className="btn-secondary">
  Annuler
</button>
```

### Bouton icône (obligatoire : aria-label)

```tsx
<button className="btn-icon" aria-label="Fermer le panneau">
  <XMarkIcon className="w-5 h-5" />
</button>
```

### Carte

```tsx
<div className="card p-4">
  {/* contenu */}
</div>
```

Variante avec bordure éco pour l'itinéraire recommandé :
```tsx
<div className="card p-4 border border-eco shadow-eco">
```

### Chip de mode de transport

```tsx
<span
  className="chip-mode"
  style={{
    color: 'var(--color-mode-bike)',
    borderColor: 'var(--color-mode-bike)',
    backgroundColor: 'rgba(74, 222, 128, 0.10)',
  }}
>
  <BikeIcon className="w-4 h-4" />
  Vélo
</span>
```

### Input de formulaire

```tsx
<div>
  <label htmlFor="origin" className="block text-body-sm font-medium text-secondary-dark mb-2">
    Point de départ
  </label>
  <input
    id="origin"
    type="text"
    className="input w-full"
    placeholder="Adresse ou lieu..."
  />
</div>
```

JAMAIS un input sans `<label>` associé — violation WCAG directe.

### Skeleton (chargement)

```tsx
<div className="skeleton h-4 w-3/4" />
<div className="skeleton h-4 w-1/2 mt-2" />
```

### Toast / notification

```tsx
<div role="status" aria-live="polite" aria-atomic="true">
  <div className="toast">
    Message de feedback
  </div>
</div>
```

### Bottom sheet

```tsx
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="sheet-title"
  className="bottom-sheet p-4"
>
  <h2 id="sheet-title" className="text-h2 font-semibold text-primary-dark">
    Titre
  </h2>
</div>
```

### Glassmorphism (panels sur la carte)

```tsx
<div className="glass rounded-lg p-4">   {/* blur 16px */}
<div className="glass-sm rounded-md p-3"> {/* blur 8px */}
```

---

## Règles typographiques

Police : **Inter uniquement** (`--font-sans`)

| Niveau | Classe taille | Graisse | Usage |
|--------|--------------|---------|-------|
| Display | `text-display` | `font-extrabold` (800) | Chiffres dashboard, stats clés |
| H1 | `text-h1` | `font-bold` (700) | Titres de page |
| H2 | `text-h2` | `font-semibold` (600) | Titres de section |
| H3 | `text-h3` | `font-semibold` (600) | Sous-titres, titres de carte |
| Body LG | `text-body-lg` | `font-normal` (400) | Corps principal, inputs |
| Body | `text-body` | `font-normal` (400) | Corps standard |
| Body SM | `text-body-sm` | `font-normal` (400) | Méta, descriptions |
| Caption | `text-caption` | `font-medium` (500) | Labels uppercase (`tracking-label`) |

```tsx
// ✅ Correct
<h1 className="text-h1 font-bold text-primary-dark">Mes itinéraires</h1>
<p className="text-body text-secondary-dark">Description...</p>
<span className="text-caption tracking-label text-muted-dark">CO₂ ÉCONOMISÉ</span>

// ❌ Interdit
<h1 className="text-2xl font-bold text-slate-900">  // valeurs Tailwind génériques
<p style={{ fontSize: '15px' }}>                    // valeur absolue CSS
```

---

## Espacement

Grille **4px**. Utiliser les tokens `--space-*` via Tailwind ou les variables CSS.

| Token | Valeur | Tailwind équivalent |
|-------|--------|-------------------|
| `--space-1` | 4px | `p-1` / `gap-1` |
| `--space-2` | 8px | `p-2` / `gap-2` |
| `--space-3` | 12px | `p-3` / `gap-3` |
| `--space-4` | 16px | `p-4` / `gap-4` |
| `--space-5` | 20px | `p-5` / `gap-5` |
| `--space-6` | 24px | `p-6` / `gap-6` |
| `--space-8` | 32px | `p-8` / `gap-8` |
| `--space-12` | 48px | `p-12` / `gap-12` |

Conventions :
- Padding interne card : `p-4` (mobile) → `p-6` (desktop)
- Gap liste d'itinéraires : `gap-3` ou `gap-4`
- Padding horizontal de page : `px-4` (mobile) → `px-6` (desktop)
- Jamais de valeur absolue CSS (`style={{ padding: '13px' }}`)

---

## Accessibilité — Non-négociable

Chaque composant DOIT :

1. **Images** : `alt` descriptif sur tout `<img>`. `alt=""` si décorative.
2. **Formulaires** : `<label>` avec `htmlFor` pour chaque input.
3. **Boutons icône** : `aria-label="Description de l'action"`.
4. **États dynamiques** : `role="status" aria-live="polite"` sur les zones de feedback.
5. **Focus** : les classes `.btn-primary`, `.btn-secondary`, `.btn-icon`, `.input` gèrent le focus visible — ne pas surcharger avec `outline-none` sans compensation.
6. **Couleur** : jamais seule pour transmettre une info — toujours icône + couleur ou texte + couleur.
7. **Zones tactiles** : `btn-primary` et `btn-secondary` ont déjà `height: var(--h-btn)` (52px). Pour les autres éléments interactifs : minimum `min-h-[44px] min-w-[44px]`.
8. **Carte Leaflet** : `role="application" aria-label="Carte de mobilité de Nantes"` sur le container.
9. **Bottom sheet** : `role="dialog" aria-modal="true" aria-labelledby` + focus trap JS (WCAG 2.1.2).
10. **Toast** : `role="status" aria-live="polite" aria-atomic="true"` sur le wrapper.

---

## Animations — Règles strictes

Éco-conception : minimum vital uniquement.

✅ Autorisé :
```tsx
className="animate-fade-in"         // opacity 0→1, 200ms
className="animate-slide-up"        // translateY + fade, 300ms (bottom sheet)
className="animate-badge-unlock"    // scale + fade, 600ms (badges seulement)
className="animate-shimmer"         // skeleton loading
className="animate-eco-pulse"       // dot éco (indicateur live uniquement)
className="transition-colors"       // hover/focus — durée via --dur-normal
```

❌ Interdit :
- `framer-motion` sauf justification documentée
- Animations en boucle visibles en permanence (hors skeleton et eco-pulse sur indicateur)
- Scroll animations, parallaxe, GSAP ScrollTrigger
- `animate-spin`, `animate-bounce` (non conformes à l'identité)

`prefers-reduced-motion` est géré globalement dans `index.css` — pas besoin de le gérer composant par composant.

---

## Responsive — Mobile-first obligatoire

Structure : `[mobile] md:[tablette] lg:[desktop]`

```tsx
// ✅ Correct
<div className="px-4 py-6 lg:px-8 lg:py-10">

// ❌ Incorrect — ordre inversé
<div className="lg:px-8 px-4">
```

---

## Layout de page — Structure standard

```tsx
// Page standard (dark theme actif par défaut sur <html>)
<div className="min-h-screen bg-base flex flex-col">

  {/* Top bar fixe */}
  <header
    className="glass fixed top-0 inset-x-0 z-[var(--z-nav)] border-b"
    style={{ height: 'var(--h-topbar)', borderColor: 'var(--color-border)' }}
  >
  </header>

  {/* Contenu scrollable */}
  <main
    className="flex-1 overflow-y-auto px-4 lg:px-6"
    style={{ paddingTop: 'var(--h-topbar)', paddingBottom: 'var(--h-bottomnav)' }}
  >
  </main>

  {/* Bottom navigation */}
  <nav
    className="bottom-nav"
    aria-label="Navigation principale"
  >
  </nav>

</div>
```

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

- Toujours named export (pas default)
- Toujours typer les props
- Composant pur : logique dans hooks, pas dans le JSX

---

## Interdictions formelles

- PAS de valeur hex en dur dans les classes (`text-[#4ADE80]`) — utiliser `text-eco`
- PAS de `style={{ color: '...' }}` sauf pour les couleurs de polyline Leaflet et les couleurs de mode transport dans les chips
- PAS de `text-slate-*`, `bg-gray-*`, `text-zinc-*` — utiliser les tokens du design system
- PAS de `outline-none` sans focus visible compensatoire
- PAS de `text-xs` sur du texte fonctionnel — minimum `text-caption` (11px)
- PAS de marge négative sans commentaire expliquant pourquoi
- PAS de `!important` Tailwind sauf override Leaflet documenté
