# UrbanFlow 2.0 — Design System Reference
> Tokens Tailwind CSS v4 · Référence de mise en oeuvre

## Tokens CSS à intégrer dans `index.css`

```css
@theme {
  /* ── Surfaces (Urban Night) ─────────────── */
  --color-bg-deep:      #060C08;
  --color-bg-base:      #0C1510;
  --color-bg-elevated:  #142218;
  --color-bg-card:      #1C2E20;

  /* ── Textes ──────────────────────────────── */
  --color-text-primary:   #F0FDF4;
  --color-text-secondary: #BBF7D0;
  --color-text-muted:     #6EE7B7;
  --color-text-disabled:  #4D6B55;

  /* ── Accents ─────────────────────────────── */
  --color-accent-eco:         #4ADE80;
  --color-accent-eco-dim:     rgba(74, 222, 128, 0.12);
  --color-accent-eco-glow:    rgba(74, 222, 128, 0.20);
  --color-accent-transit:     #60A5FA;
  --color-accent-transit-dim: rgba(96, 165, 250, 0.12);

  /* ── Modes de transport ──────────────────── */
  --color-mode-walk:     #94A3B8;
  --color-mode-bike:     #4ADE80;
  --color-mode-tram:     #818CF8;
  --color-mode-bus:      #FCD34D;
  --color-mode-scooter:  #22D3EE;
  --color-mode-navibus:  #38BDF8;
  --color-mode-train:    #A78BFA;

  /* ── Sémantique ──────────────────────────── */
  --color-success:      #22C55E;  /* 7.25:1 sur bg-elevated ✅ */
  --color-warning:      #F59E0B;  /* 7.69:1 sur bg-elevated ✅ */
  /* error/info : valeurs pour icônes, bordures, fond de chips (non texte) */
  --color-error:        #EF4444;  /* 4.39:1 → AA large seulement, NE PAS utiliser comme texte normal */
  --color-info:         #3B82F6;  /* 4.49:1 → AA large seulement, NE PAS utiliser comme texte normal */
  /* Variantes texte (WCAG AA sur tous les fonds sombres) */
  --color-error-text:   #F87171;  /* 5.97:1 sur bg-elevated ✅ AA */
  --color-info-text:    #93C5FD;  /* 9.16:1 sur bg-elevated ✅ AAA */

  /* ── Bordures ────────────────────────────── */
  --color-border:       rgba(255, 255, 255, 0.07);
  --color-border-strong: rgba(255, 255, 255, 0.13);
  --color-border-eco:   rgba(74, 222, 128, 0.25);

  /* ── Overlay ─────────────────────────────── */
  --color-overlay: rgba(6, 12, 8, 0.85);

  /* ── Typographie ─────────────────────────── */
  --font-sans: 'Inter', system-ui, -apple-system, sans-serif;

  /* Tailles */
  --text-display: 2rem;      /* 32px — Extra Bold 800 — Chiffres dashboard */
  --text-h1:      1.625rem;  /* 26px — Bold 700      — Titres de page */
  --text-h2:      1.25rem;   /* 20px — Semi Bold 600 — Titres de section */
  --text-h3:      1.0625rem; /* 17px — Semi Bold 600 — Sous-titres */
  --text-body-lg: 1rem;      /* 16px — Regular 400   — Corps principal (évite zoom iOS) */
  --text-body:    0.9375rem; /* 15px — Regular 400   — Corps standard */
  --text-body-sm: 0.8125rem; /* 13px — Regular 400   — Méta, descriptions */
  --text-caption: 0.6875rem; /* 11px — Medium 500    — Labels uppercase */

  /* Graisses */
  --font-weight-regular:   400;
  --font-weight-medium:    500;
  --font-weight-semibold:  600;
  --font-weight-bold:      700;
  --font-weight-extrabold: 800;

  /* ── Spacing (base 4px) ──────────────────── */
  --space-1:  4px;
  --space-2:  8px;
  --space-3:  12px;
  --space-4:  16px;
  --space-5:  20px;
  --space-6:  24px;
  --space-8:  32px;
  --space-12: 48px;

  /* ── Rayons ──────────────────────────────── */
  --radius-sm:   6px;
  --radius-md:   12px;
  --radius-lg:   16px;
  --radius-xl:   24px;
  --radius-full: 9999px;

  /* ── Ombres ──────────────────────────────── */
  --shadow-1: 0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.3);
  --shadow-2: 0 4px 12px rgba(0,0,0,0.5), 0 2px 4px rgba(0,0,0,0.3);
  --shadow-3: 0 12px 32px rgba(0,0,0,0.6), 0 4px 8px rgba(0,0,0,0.4);
  --shadow-4: 0 24px 48px rgba(0,0,0,0.7);
  --shadow-eco:     0 0 20px rgba(74,222,128,0.30), 0 0 40px rgba(74,222,128,0.10);
  --shadow-transit: 0 0 20px rgba(96,165,250,0.25);

  /* ── Easing ──────────────────────────────── */
  --ease-out:    cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in:     cubic-bezier(0.4, 0, 1, 1);
  --ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);
  --ease-ui:     cubic-bezier(0.4, 0, 0.2, 1);

  /* ── Durées d'animation ──────────────────── */
  --dur-fast:   120ms;
  --dur-normal: 200ms;
  --dur-slow:   300ms;
  --dur-xslow:  400ms;

  /* ── Z-index ─────────────────────────────── */
  --z-map:      0;
  --z-overlay:  10;
  --z-sheet:    20;
  --z-nav:      30;
  --z-modal:    40;
  --z-toast:    50;
  --z-splash:   60;

  /* ── Hauteurs fixes ──────────────────────── */
  --h-topbar:  56px;
  --h-bottomnav: 64px;
  --h-input:   52px;
  --h-btn:     52px;

  /* ── Animations keyframes ────────────────── */
  @keyframes eco-pulse {
    0%   { transform: scale(1); opacity: 0.8; }
    70%  { transform: scale(2.2); opacity: 0; }
    100% { transform: scale(2.2); opacity: 0; }
  }

  @keyframes shimmer {
    0%   { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }

  @keyframes badge-unlock {
    0%   { transform: scale(0.85); opacity: 0; }
    40%  { transform: scale(1.08); opacity: 1; }
    70%  { transform: scale(0.97); }
    100% { transform: scale(1); }
  }

  @keyframes slide-up {
    from { transform: translateY(100%); }
    to   { transform: translateY(0); }
  }

  @keyframes fade-in {
    from { opacity: 0; }
    to   { opacity: 1; }
  }

  --animate-eco-pulse:    eco-pulse 2s ease-out infinite;
  --animate-shimmer:      shimmer 1.5s linear infinite;
  --animate-badge-unlock: badge-unlock 600ms ease-out forwards;
  --animate-slide-up:     slide-up 300ms cubic-bezier(0.16,1,0.3,1) forwards;
  --animate-fade-in:      fade-in 200ms ease-out forwards;
}

/* ── prefers-reduced-motion ────────────────────────────────── */
/* WCAG 2.3.3 (AAA) + éco-conception : désactive toutes les    */
/* animations non essentielles pour les utilisateurs sensibles */
/* ET réduit la charge GPU des appareils bas de gamme.         */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }

  /* Exceptions : les spinners et skeletons doivent rester visibles */
  .spinner-ring { animation-duration: 1s !important; animation-iteration-count: infinite !important; }
}
```

## Classes utilitaires Tailwind custom

```css
/* Surfaces */
@utility bg-base      { background-color: var(--color-bg-base); }
@utility bg-elevated  { background-color: var(--color-bg-elevated); }
@utility bg-card      { background-color: var(--color-bg-card); }
@utility bg-overlay   { background-color: var(--color-overlay); }

/* Textes */
@utility text-primary-dark   { color: var(--color-text-primary); }
@utility text-secondary-dark { color: var(--color-text-secondary); }
@utility text-muted-dark     { color: var(--color-text-muted); }

/* Accents */
@utility text-eco        { color: var(--color-accent-eco); }
@utility text-transit    { color: var(--color-accent-transit); }
@utility bg-eco-dim      { background-color: var(--color-accent-eco-dim); }
@utility border-eco      { border-color: var(--color-border-eco); }

/* Ombres */
@utility shadow-eco      { box-shadow: var(--shadow-eco); }
@utility shadow-transit  { box-shadow: var(--shadow-transit); }

/* Animations */
@utility animate-eco-pulse    { animation: var(--animate-eco-pulse); }
@utility animate-shimmer      { animation: var(--animate-shimmer); }
@utility animate-badge-unlock { animation: var(--animate-badge-unlock); }
@utility animate-slide-up     { animation: var(--animate-slide-up); }

/* Backdrop blur — avec @supports fallback (éco + a11y) */
/* Sur appareils sans GPU ou avec prefers-reduced-motion, */
/* le fond opaque remplace le blur pour éviter le jank.   */
@utility glass {
  @supports (backdrop-filter: blur(1px)) {
    backdrop-filter: blur(16px);
    background-color: rgba(12, 21, 16, 0.80); /* semi-transparent ssi blur supporté */
  }
  @supports not (backdrop-filter: blur(1px)) {
    background-color: rgba(12, 21, 16, 0.97); /* opaque fallback */
  }
}
@utility glass-sm {
  @supports (backdrop-filter: blur(1px)) {
    backdrop-filter: blur(8px);
    background-color: rgba(20, 34, 24, 0.82);
  }
  @supports not (backdrop-filter: blur(1px)) {
    background-color: rgba(20, 34, 24, 0.97);
  }
}

/* Tabular numbers */
@utility tabular { font-variant-numeric: tabular-nums; }

/* Letter spacing labels */
@utility tracking-label { letter-spacing: 0.08em; text-transform: uppercase; }
```

## Classes de composants (@layer components)

```css
@layer components {
  /* ── Bouton primaire ─────────────────────── */
  .btn-primary {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    height: var(--h-btn);
    padding: 0 24px;
    background: var(--color-accent-eco);
    color: #060C08; /* 11.33:1 ✅ AAA */
    font-size: var(--text-body-lg);
    font-weight: 600;
    border-radius: var(--radius-md);
    border: 2px solid transparent;
    cursor: pointer;
    box-shadow: var(--shadow-eco);
    transition: transform var(--dur-fast) var(--ease-out),
                box-shadow var(--dur-fast) var(--ease-out),
                opacity var(--dur-fast);
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;

    &:hover { filter: brightness(1.08); }
    &:active { transform: scale(0.97); box-shadow: 0 0 12px rgba(74,222,128,0.2); }
    &:disabled { opacity: 0.35; cursor: not-allowed; box-shadow: none; pointer-events: none; }

    /* WCAG 2.4.7 Focus Visible — anneau éco bien visible */
    &:focus-visible {
      outline: none;
      border-color: #F0FDF4;
      box-shadow: var(--shadow-eco), 0 0 0 3px #F0FDF4;
    }
  }

  /* ── Bouton secondaire ───────────────────── */
  .btn-secondary {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    height: var(--h-btn);
    padding: 0 24px;
    background: transparent;
    color: var(--color-text-primary);
    font-size: var(--text-body-lg);
    font-weight: 500;
    border-radius: var(--radius-md);
    border: 1px solid var(--color-border-strong);
    cursor: pointer;
    transition: background var(--dur-normal) var(--ease-ui),
                transform var(--dur-fast) var(--ease-out);
    touch-action: manipulation;

    &:hover { background: rgba(255,255,255,0.05); }
    &:active { transform: scale(0.97); }
    &:disabled { opacity: 0.35; cursor: not-allowed; pointer-events: none; }

    /* WCAG 2.4.7 Focus Visible */
    &:focus-visible {
      outline: none;
      border-color: var(--color-accent-eco);
      box-shadow: 0 0 0 3px rgba(74, 222, 128, 0.4);
    }
  }

  /* ── Bouton icône ────────────────────────── */
  .btn-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    background: var(--color-bg-card);
    color: var(--color-text-secondary);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    cursor: pointer;

    /* backdrop-filter via @supports (fallback opaque si non supporté) */
    @supports (backdrop-filter: blur(1px)) { backdrop-filter: blur(12px); }

    transition: border-color var(--dur-normal), color var(--dur-normal),
                transform var(--dur-fast) var(--ease-out);
    touch-action: manipulation;

    &:hover { border-color: var(--color-border-strong); color: var(--color-text-primary); }
    &:active { transform: scale(0.95); background: var(--color-bg-elevated); }

    /* WCAG 2.4.7 Focus Visible — anneau eco sur les boutons icône */
    &:focus-visible {
      outline: none;
      border-color: var(--color-accent-eco);
      box-shadow: 0 0 0 3px rgba(74, 222, 128, 0.4);
    }
  }

  /* ── Carte de composant ──────────────────── */
  .card {
    background: var(--color-bg-elevated);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-2);
  }

  /* ── Chip de mode ────────────────────────── */
  .chip-mode {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: 32px;
    padding: 0 12px;
    border-radius: var(--radius-full);
    font-size: var(--text-body-sm);
    font-weight: 500;
    border: 1px solid;
  }

  /* ── Input ───────────────────────────────── */
  .input {
    display: flex;
    align-items: center;
    gap: 12px;
    height: var(--h-input);
    padding: 0 16px;
    background: var(--color-bg-elevated);
    color: var(--color-text-primary);
    font-size: var(--text-body-lg); /* 16px — évite le zoom iOS */
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    /* NE PAS mettre outline:none sans compensation — WCAG 2.4.7 */
    outline: none;
    transition: border-color var(--dur-normal), box-shadow var(--dur-normal);

    &::placeholder { color: var(--color-text-muted); } /* 10.83:1 ✅ AAA */

    /* :focus-visible au lieu de :focus — anneau visible uniquement clavier,
       mais box-shadow active au clic aussi pour feedback visuel mobile */
    &:focus {
      border-color: var(--color-accent-eco);
      box-shadow: 0 0 0 3px rgba(74, 222, 128, 0.25);
    }
    &:focus-visible {
      border-color: var(--color-accent-eco);
      box-shadow: 0 0 0 3px rgba(74, 222, 128, 0.45); /* anneau renforcé clavier */
    }
  }

  /* ── Bottom sheet ────────────────────────── */
  .bottom-sheet {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: var(--color-bg-base);
    border-radius: var(--radius-xl) var(--radius-xl) 0 0;
    box-shadow: var(--shadow-4);
    z-index: var(--z-sheet);
    max-height: 65vh;
    overflow-y: auto;
    overscroll-behavior: contain;
  }

  /* ── Skeleton ────────────────────────────── */
  .skeleton {
    background: linear-gradient(
      90deg,
      var(--color-bg-card) 0%,
      rgba(255,255,255,0.06) 40%,
      rgba(255,255,255,0.06) 60%,
      var(--color-bg-card) 100%
    );
    background-size: 300% 100%;
    animation: shimmer 1.5s linear infinite;
    border-radius: var(--radius-sm);
  }

  /* ── Toast ───────────────────────────────── */
  .toast {
    position: fixed;
    bottom: calc(var(--h-bottomnav) + env(safe-area-inset-bottom) + 8px);
    left: 16px;
    right: 16px;
    background: var(--color-bg-card);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    padding: 14px 16px;
    box-shadow: var(--shadow-3);
    z-index: var(--z-toast);
    animation: var(--animate-slide-up);
  }

  /* ── Bottom navigation ───────────────────── */
  /* aria : <nav aria-label="Navigation principale" role="navigation"> */
  .bottom-nav {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: calc(var(--h-bottomnav) + env(safe-area-inset-bottom));
    padding-bottom: env(safe-area-inset-bottom);
    border-top: 1px solid var(--color-border);
    display: flex;
    align-items: center;
    justify-content: space-around;
    z-index: var(--z-nav);

    /* backdrop-filter avec fallback opaque */
    @supports (backdrop-filter: blur(1px)) {
      background: rgba(12, 21, 16, 0.92);
      backdrop-filter: blur(20px);
    }
    @supports not (backdrop-filter: blur(1px)) {
      background: rgba(12, 21, 16, 0.99);
    }
  }

  /* ── Toast ── aria-live="polite" requis sur le conteneur ── */
  /* <div role="status" aria-live="polite" aria-atomic="true"> */
  .toast {
    position: fixed;
    bottom: calc(var(--h-bottomnav) + env(safe-area-inset-bottom) + 8px);
    left: 16px;
    right: 16px;
    background: var(--color-bg-card);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    padding: 14px 16px;
    box-shadow: var(--shadow-3);
    z-index: var(--z-toast);
    animation: var(--animate-slide-up);
  }

  /* ── Bottom sheet ── aria-modal="true" requis ── */
  /* <div role="dialog" aria-modal="true" aria-labelledby="sheet-title"> */
  .bottom-sheet {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: var(--color-bg-base);
    border-radius: var(--radius-xl) var(--radius-xl) 0 0;
    box-shadow: var(--shadow-4);
    z-index: var(--z-sheet);
    max-height: 65vh;
    overflow-y: auto;
    overscroll-behavior: contain;
    /* Focus trap requis côté JS quand la sheet est ouverte (WCAG 2.1.2) */
  }
}

/* ══════════════════════════════════════════════════════════════
 * LIGHT MODE — "Urban Day"
 * Activé via <html data-theme="light"> (géré par le store Zustand)
 * Fallback : @media (prefers-color-scheme: light) si pas de préférence
 * ══════════════════════════════════════════════════════════════ */

/* Système de thème : par défaut dark, bascule en light via data-theme */
:root {
  color-scheme: dark;
}
[data-theme="light"] {
  color-scheme: light;
}

@layer base {
  /* Sélecteur [data-theme="light"] ET media fallback si aucune préférence */
  [data-theme="light"],
  @media (prefers-color-scheme: light) {
    :root:not([data-theme="dark"]) {

      /* ── Surfaces ──────────────────────────── */
      --color-bg-deep:      #ECFDF5;  /* vert-50 légèrement saturé */
      --color-bg-base:      #F7FFF9;  /* fond principal, blanc verdâtre doux */
      --color-bg-elevated:  #FFFFFF;  /* cartes — fond pur blanc */
      --color-bg-card:      #F0FDF4;  /* cartes imbriquées — vert-50 */

      /* ── Textes ─────────────────────────────── */
      /* Tous vérifiés WCAG AA sur #FFFFFF */
      --color-text-primary:   #052E16;  /* 14.91:1 ✅ AAA — vert-950 */
      --color-text-secondary: #14532D;  /*  9.11:1 ✅ AAA — vert-900 */
      --color-text-muted:     #166534;  /*  7.13:1 ✅ AAA — vert-800 */
      --color-text-disabled:  #86EFAC;  /*  1.40:1 — exempt (inactif WCAG 1.4.3) */

      /* ── Accents ─────────────────────────────── */
      --color-accent-eco:         #4ADE80;  /* badge/chip bg uniquement, PAS texte */
      --color-accent-eco-cta:     #166534;  /* fond bouton CTA → texte blanc 7.13:1 ✅ */
      --color-accent-eco-text:    #15803D;  /* texte éco sur fond clair 5.02:1 ✅ */
      --color-accent-eco-dim:     rgba(74, 222, 128, 0.18);
      --color-accent-eco-glow:    rgba(21, 128, 61, 0.15);
      --color-accent-transit:     #1D4ED8;  /* bleu-700 6.70:1 ✅ */
      --color-accent-transit-dim: rgba(29, 78, 216, 0.10);

      /* ── Modes de transport — texte foncé (light mode) ─── */
      /* Utilisés dans les chips à la place des couleurs vives */
      --color-mode-walk-text:    #374151;  /* gray-700   9.09:1 ✅ */
      --color-mode-bike-text:    #15803D;  /* green-700  4.57:1 ✅ */
      --color-mode-tram-text:    #4338CA;  /* indigo-700 6.81:1 ✅ */
      --color-mode-bus-text:     #92400E;  /* amber-800  6.67:1 ✅ */
      --color-mode-scooter-text: #155E75;  /* cyan-800   6.54:1 ✅ */
      --color-mode-navibus-text: #0369A1;  /* sky-700    5.28:1 ✅ */
      --color-mode-train-text:   #6D28D9;  /* violet-700 6.19:1 ✅ */

      /* ── Sémantique ─────────────────────────── */
      --color-success:      #15803D;  /* 5.02:1 ✅ */
      --color-warning:      #92400E;  /* 7.09:1 ✅ AAA */
      --color-error:        #DC2626;  /* 4.83:1 ✅ AA — texte ET icônes */
      --color-error-text:   #DC2626;  /* identique en light */
      --color-info:         #1D4ED8;  /* 6.70:1 ✅ AA */
      --color-info-text:    #1D4ED8;  /* identique en light */

      /* ── Bordures ─────────────────────────────── */
      --color-border:        rgba(5, 46, 22, 0.10);   /* vert très doux */
      --color-border-strong: rgba(5, 46, 22, 0.20);
      --color-border-eco:    rgba(22, 101, 52, 0.30);

      /* ── Overlay (modale) ─────────────────────── */
      --color-overlay: rgba(5, 46, 22, 0.55);

      /* ── Ombres — plus légères en light ──────── */
      --shadow-1: 0 1px 3px rgba(5,46,22,0.08), 0 1px 2px rgba(5,46,22,0.05);
      --shadow-2: 0 4px 12px rgba(5,46,22,0.10), 0 2px 4px rgba(5,46,22,0.06);
      --shadow-3: 0 12px 32px rgba(5,46,22,0.12), 0 4px 8px rgba(5,46,22,0.08);
      --shadow-4: 0 24px 48px rgba(5,46,22,0.15);

      /* Glow light — subtil drop shadow vert au lieu de neon */
      --shadow-eco:     0 4px 16px rgba(21, 128, 61, 0.25), 0 2px 6px rgba(21,128,61,0.15);
      --shadow-transit: 0 4px 16px rgba(29, 78, 216, 0.20);

      /* ── Carte : tuiles Positron en light mode ──── */
      /* Côté React : passer l'URL via un token CSS ou prop conditionnelle */
      /* CartoDB Positron : https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png */
    }
  }
}

/* ── Surcharges de composants pour le light mode ────────────── */
[data-theme="light"],
@media (prefers-color-scheme: light) {
  :root:not([data-theme="dark"]) {

    /* Bouton primaire : fond vert foncé + texte blanc */
    .btn-primary {
      background: var(--color-accent-eco-cta); /* #166534 */
      color: #FFFFFF;
      box-shadow: var(--shadow-eco);

      &:hover { filter: brightness(1.10); }
      &:focus-visible {
        border-color: #052E16;
        box-shadow: var(--shadow-eco), 0 0 0 3px rgba(5, 46, 22, 0.4);
      }
    }

    /* Input : fond blanc, bordure verte subtile */
    .input {
      background: var(--color-bg-elevated);
      border-color: var(--color-border);
      color: var(--color-text-primary);

      &::placeholder { color: var(--color-text-muted); } /* 7.13:1 ✅ */
      &:focus {
        border-color: var(--color-accent-eco-text);
        box-shadow: 0 0 0 3px rgba(21, 128, 61, 0.20);
      }
      &:focus-visible {
        box-shadow: 0 0 0 3px rgba(21, 128, 61, 0.40);
      }
    }

    /* Bottom sheet : fond blanc mat */
    .bottom-sheet {
      background: var(--color-bg-elevated);
      border-top: 1px solid var(--color-border);
    }

    /* Skeleton : shimmer clair */
    .skeleton {
      background: linear-gradient(
        90deg,
        var(--color-bg-card) 0%,
        rgba(5, 46, 22, 0.04) 40%,
        rgba(5, 46, 22, 0.04) 60%,
        var(--color-bg-card) 100%
      );
      background-size: 300% 100%;
    }

    /* Bottom navigation : fond blanc avec séparateur */
    .bottom-nav {
      border-top: 1px solid var(--color-border);

      @supports (backdrop-filter: blur(1px)) {
        background: rgba(247, 255, 249, 0.92);
        backdrop-filter: blur(20px);
      }
      @supports not (backdrop-filter: blur(1px)) {
        background: rgba(247, 255, 249, 0.99);
      }
    }

    /* Carte Leaflet : remplacer les tuiles Dark Matter par Positron */
    /* À implémenter côté React via store de thème : */
    /* const tileUrl = theme === 'light'
         ? 'https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
         : 'https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png' */
  }
}
```
