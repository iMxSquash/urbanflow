# UrbanFlow SmartRoute — Design System Reference
> Direction créative "Estuaire" · Tokens Tailwind CSS v4 · Référence de mise en oeuvre
>
> Source de vérité : projet Claude Design ["Urbanflow design directions"](https://claude.ai/design/p/f442a1d6-2613-40e4-a799-50f42376ca1c) — fichiers `1a Estuaire - Palette.dc.html` et `1a Estuaire - Espacement et rayons.dc.html`. Ce fichier est une transcription fidèle de ces tokens, pas une réinterprétation.

## Tokens CSS à intégrer dans `index.css`

Contrairement à la version précédente ("Urban Night"), **le mode clair est le mode par défaut** ("sable et vert profond") ; le mode sombre est une surcharge via `[data-theme="dark"]`.

```css
@theme {
  /* ── Police ──────────────────────────────── */
  --font-sans: 'Instrument Sans', system-ui, -apple-system, sans-serif;

  /* ── Typographie ─────────────────────────── */
  --text-display: 2.75rem;   /* 44px — 700 — tabular-nums, tracking -0.03em */
  --text-titre:   1.6875rem; /* 27px — 700 */
  --text-section: 1.25rem;   /* 20px — 600 */
  --text-corps:   1rem;      /* 16px — 400 — évite le zoom iOS */
  --text-label:   0.8125rem; /* 13px — 600 */
  --text-caption: 0.75rem;   /* 12px — 400 — jamais en dessous de cette taille */

  /* ── Spacing (grille 4px, 8 paliers) ──────── */
  --space-1: 4px;   /* gap bottom-nav, icône+coche */
  --space-2: 8px;   /* gap chips, cartes de résultat */
  --space-3: 12px;  /* gap vertical sheet, padding pill */
  --space-4: 16px;  /* padding horizontal sheet mobile, marge écran */
  --space-5: 20px;  /* header mobile, padding carte desktop */
  --space-6: 24px;  /* gap entre blocs, padding modale */
  --space-8: 32px;  /* padding vertical page desktop */
  --space-10: 40px; /* padding horizontal page desktop */

  /* ── Rayons ──────────────────────────────── */
  --radius-xs: 6px;    /* checkboxes, mini pastilles de mode */
  --radius-sm: 8px;    /* badges de segment, pastilles numérotées, barres de graphe */
  --radius-md: 12px;   /* inputs, boutons secondaires, items de liste, boutons icône */
  --radius-lg: 14px;   /* boutons primaires, item de nav actif, bandeaux d'alerte */
  --radius-xl: 16px;   /* cartes de résultat/contenu (18px en desktop) */
  --radius-2xl: 24px;  /* bottom sheet (coins hauts uniquement), modales, cartes desktop */
  --radius-full: 9999px; /* chips mode/profil, toggles, avatars, jauges, poignée de sheet */

  /* Règle d'imbrication : le rayon d'un enfant = rayon du parent − padding,
     arrondi au palier inférieur. La bottom sheet n'arrondit que ses coins hauts. */

  /* ── Tailles de contrôle (cibles tactiles) ─── */
  --control-xs: 28px;  /* badges/toggles non interactifs */
  --control-sm: 36px;  /* chips de mode en sheet mi-hauteur, bouton fermer */
  --control-md: 40px;  /* chips de mode pleine taille, boutons icône desktop */
  --control-lg: 44px;  /* cible tactile minimum — chips profil, boutons icône flottants carte */
  --control-xl: 48px;  /* champs de saisie, lignes de réglage, boutons secondaires */
  --control-2xl: 52px; /* action principale de l'écran (une seule par vue) */

  /* ── Bordures ────────────────────────────── */
  --border-width: 1px;
  --border-width-selected: 1.5px;
  --border-width-active: 2px;
  --accent-width: 4px; /* liseré gauche coloré sur carte à mode de transport */

  /* ── Layout ──────────────────────────────── */
  --screen-pad: 16px;      /* marge écran mobile */
  --page-pad-x: 40px;      /* padding horizontal page desktop */
  --page-pad-y: 32px;      /* padding vertical page desktop */
  --content-max: 1040px;   /* largeur de lecture max desktop */
  --nav-rail: 232px;       /* largeur sidebar desktop (remplace bottom nav) */
  --search-panel: 400px;   /* panneau latéral desktop (min 380px) */
  --modal-width: 560px;    /* largeur modale desktop (520-560px) */

  /* ── Motion ──────────────────────────────── */
  --ease-ui: cubic-bezier(0, 0, 0.2, 1);
  --dur-fast: 120ms;   /* changement d'état d'un contrôle */
  --dur-base: 180ms;   /* apparition de modale */
  --dur-sheet: 200ms;  /* transition de position du bottom sheet */
  /* Propriétés animées : transform / opacity UNIQUEMENT — jamais height, top, box-shadow.
     Aucune animation décorative, boucle ou parallaxe (éco-conception). */

  /* ── Couleurs — mode clair (défaut) ───────── */
  --color-bg: #F6F4EF;
  --color-surface: #FFFFFF;
  --color-surface-muted: #FBFAF7;
  --color-surface-sunken: #EDEAE2;
  --color-border: #DCD7CB;
  --color-border-strong: #C7BFAF;

  --color-text: #14231D;          /* 14,9:1 sur surface */
  --color-text-muted: #47544D;    /* 7,1:1 */
  --color-text-subtle: #6B7A72;   /* 4,6:1 */
  --color-text-disabled: #8A9690;

  --color-primary: #0B5C43;         /* 8,0:1 — action possible + gain éco. Jamais utilisé ailleurs. */
  --color-primary-hover: #094B37;
  --color-primary-surface: #E4EFE9;
  --color-primary-weak: #A8C9BB;
  --color-on-primary: #FFFFFF;
  --color-on-primary-muted: #C7E0D5;

  --color-transit: #1D5E7A;         /* 6,1:1 — identifie le TC, jamais une action */
  --color-transit-surface: #E7EEF2;

  --color-mode-walk: #5B6B63;            --color-mode-walk-surface: #EDEAE2;
  --color-mode-bike: #0B5C43;            --color-mode-bike-surface: #E4EFE9;
  --color-mode-scooter: #5C6E1A;         --color-mode-scooter-surface: #EFF1DC;
  --color-mode-tram: #1D5E7A;            --color-mode-tram-surface: #E7EEF2;
  --color-mode-bus: #6B3F8F;             --color-mode-bus-surface: #F0E8F5;
  --color-mode-navibus: #0F6B6B;         --color-mode-navibus-surface: #E0F0F0;
  --color-mode-train: #33449E;           --color-mode-train-surface: #E7EAF8;
  --color-mode-car: #C7BFAF;             /* référence hachurée — jamais sélectionnable */

  --color-warning: #7A4A08;         /* 7,3:1 — état inhabituel : mode démo, trajet écarté, hors ligne */
  --color-on-warning: #FFFFFF;
  --color-warning-border: #C99A4A;
  --color-warning-surface: #F5EDE2;
  --color-warning-surface-soft: #FBF3E4;

  --color-danger: #B3261E;          /* 6,3:1 — réservé exclusivement à la suppression de compte */
  --color-danger-text: #8C1D18;     /* 9,0:1 */
  --color-danger-text-muted: #7A2620;
  --color-danger-surface: #FDF4F3;
  --color-danger-surface-icon: #FDECEA;

  --map-tint: rgba(11, 92, 67, 0.10);           /* multiply, CartoDB Positron */
  --scrim: rgba(20, 35, 29, 0.52);              /* 0.60 en desktop */
  --shadow-card: 0 2px 12px rgba(20, 35, 29, 0.06);
  --shadow-sheet: 0 -6px 28px rgba(20, 35, 29, 0.14);
  --shadow-modal: 0 20px 60px rgba(20, 35, 29, 0.35);
  --focus-ring: 0 0 0 2px #F6F4EF, 0 0 0 4px #0B5C43;
}

/* ── Système de thème : clair par défaut, sombre en surcharge ───
 * Un sélecteur combinant un attribut et un @media dans la même liste
 * (`[data-theme="dark"], @media (...) { ... }`) n'est pas du CSS valide —
 * lightningcss l'ignore silencieusement. Les deux cas sont déclarés
 * séparément ci-dessous (valeurs dupliquées mais fonctionnelles). */
:root { color-scheme: light; }
[data-theme="dark"] { color-scheme: dark; }

[data-theme="dark"] {
  --color-bg: #0D1512;
  --color-surface: #16211D;
  --color-surface-muted: #12251E;
  --color-surface-sunken: #1F2C27;
  --color-border: #2C3B35;
  --color-border-strong: #24483A;

  --color-text: #EEF2EF;          /* 16,6:1 */
  --color-text-muted: #A2B0A9;    /* 8,1:1 */
  --color-text-subtle: #8C8279;   /* 5,0:1 */
  --color-text-disabled: #6B7A72;

  --color-primary: #4FCB9B;         /* 8,3:1 */
  --color-primary-hover: #3FB587;
  --color-primary-surface: #0F3A2C;
  --color-primary-weak: #2F7A5E;
  --color-on-primary: #062018;      /* 10,4:1 */
  --color-on-primary-muted: #A8C9BB;

  --color-transit: #6BB6D6;         /* 7,4:1 */
  --color-transit-surface: #16303C;

  --color-mode-walk: #A2B0A9;            --color-mode-walk-surface: #1F2C27;
  --color-mode-bike: #4FCB9B;            --color-mode-bike-surface: #0F3A2C;
  --color-mode-scooter: #B8CC5A;         --color-mode-scooter-surface: #2A2E12;
  --color-mode-tram: #6BB6D6;            --color-mode-tram-surface: #16303C;
  --color-mode-bus: #C09BE0;             --color-mode-bus-surface: #2C1F38;
  --color-mode-navibus: #58C4C4;         --color-mode-navibus-surface: #123434;
  --color-mode-train: #8FA0F0;           --color-mode-train-surface: #1B2044;
  --color-mode-car: #3A4A43;

  --color-warning: #E9A93C;         /* 8,9:1 */
  --color-on-warning: #1F1401;      /* 10,9:1 */
  --color-warning-border: #7A5E22;
  --color-warning-surface: #2A2113;
  --color-warning-surface-soft: #241C10;

  --color-danger: #F0736B;          /* 7,0:1 */
  --color-danger-text: #F0736B;
  --color-danger-text-muted: #E4A9A4;
  --color-danger-surface: #2A1614;
  --color-danger-surface-icon: #3A1D1A;

  --map-tint: rgba(15, 58, 44, 0.30);           /* screen, CartoDB Dark Matter */
  --scrim: rgba(13, 21, 18, 0.72);
  --shadow-card: 0 2px 12px rgba(0, 0, 0, 0.28);
  --shadow-sheet: 0 -6px 28px rgba(0, 0, 0, 0.40);
  --shadow-modal: 0 20px 60px rgba(0, 0, 0, 0.45);
  --focus-ring: 0 0 0 2px #0D1512, 0 0 0 4px #4FCB9B;
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]):not([data-theme="dark"]) {
    color-scheme: dark;
    /* … mêmes valeurs que le bloc [data-theme="dark"] ci-dessus … */
  }
}

/* ── prefers-reduced-motion ─────────────────────────────────── */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

**Règles d'usage des couleurs (Estuaire) :**
- Le vert (`--color-primary`) est réservé à l'action possible et au gain écologique. Jamais utilisé pour autre chose.
- Le bleu (`--color-transit`) identifie le transport en commun. Jamais une couleur d'action.
- L'ambre (`--color-warning`) signale un état inhabituel (mode démo, trajet écarté par un filtre, hors ligne, récompense expirée) — toujours accompagné d'une icône et d'un libellé.
- Le rouge (`--color-danger`) est réservé exclusivement à la suppression de compte.
- Aucune information n'est jamais portée par la seule couleur (WCAG 1.4.1) : chaque mode de transport garde son icône propre même sur fond identique.
- Seuls 3 niveaux d'ombre existent (`shadow-card`, `shadow-sheet`, `shadow-modal`). Toute autre séparation visuelle passe par une bordure 1px — pas de glassmorphism/backdrop-blur dans cette direction.
- Teinte de carte : Positron (clair) `saturate(.55) contrast(1.02)` + survol `multiply` 10% `--color-primary` ; Dark Matter (sombre) `saturate(.5) brightness(.92)` + survol `screen` 30% `#0F3A2C`. Aucun style vectoriel custom chargé (teinte 100% CSS, coût réseau nul).

## Classes utilitaires Tailwind custom

```css
@utility bg-surface        { background-color: var(--color-surface); }
@utility bg-surface-muted  { background-color: var(--color-surface-muted); }
@utility bg-surface-sunken { background-color: var(--color-surface-sunken); }

@utility text-eco        { color: var(--color-primary); }
@utility text-transit    { color: var(--color-transit); }
@utility bg-eco-surface  { background-color: var(--color-primary-surface); }
@utility border-eco      { border-color: var(--color-primary); }

@utility shadow-card  { box-shadow: var(--shadow-card); }
@utility shadow-sheet { box-shadow: var(--shadow-sheet); }
@utility shadow-modal { box-shadow: var(--shadow-modal); }

@utility tabular { font-variant-numeric: tabular-nums; }
```

## Classes de composants (@layer components)

```css
@layer components {
  /* ── Bouton primaire — une seule action principale par écran ── */
  .btn-primary {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    height: var(--control-2xl);
    padding: 0 var(--space-6);
    background: var(--color-primary);
    color: var(--color-on-primary);
    font-size: var(--text-corps);
    font-weight: 600;
    border-radius: var(--radius-lg);
    border: none;
    cursor: pointer;
    transition: background var(--dur-fast) var(--ease-ui),
                transform var(--dur-fast) var(--ease-ui);
    touch-action: manipulation;

    &:hover { background: var(--color-primary-hover); }
    &:active { transform: scale(0.97); }
    &:disabled { opacity: 0.4; cursor: not-allowed; pointer-events: none; }

    /* WCAG 2.4.7 Focus Visible */
    &:focus-visible { outline: none; box-shadow: var(--focus-ring); }
  }

  /* ── Bouton secondaire ────────────────────── */
  .btn-secondary {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    height: var(--control-xl);
    padding: 0 var(--space-5);
    background: transparent;
    color: var(--color-text);
    font-size: var(--text-corps);
    font-weight: 500;
    border-radius: var(--radius-md);
    border: var(--border-width) solid var(--color-border-strong);
    cursor: pointer;
    transition: background var(--dur-base) var(--ease-ui);

    &:hover { background: var(--color-surface-muted); }
    &:disabled { opacity: 0.4; cursor: not-allowed; pointer-events: none; }
    &:focus-visible { outline: none; box-shadow: var(--focus-ring); }
  }

  /* ── Bouton icône ─────────────────────────── */
  .btn-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: var(--control-lg);
    height: var(--control-lg);
    background: var(--color-surface);
    color: var(--color-text-muted);
    border: var(--border-width) solid var(--color-border);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-card);
    cursor: pointer;
    transition: color var(--dur-fast) var(--ease-ui);

    &:hover { color: var(--color-text); }
    &:focus-visible { outline: none; box-shadow: var(--focus-ring); }
  }

  /* ── Carte de composant (résultat, contenu) ── */
  .card {
    background: var(--color-surface);
    border: var(--border-width) solid var(--color-border);
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-card);
  }

  /* Carte accentuée par mode de transport (liseré gauche, radius inchangé) */
  .card-mode-accent {
    border-left: var(--accent-width) solid var(--mode-color, var(--color-primary));
  }

  /* ── Chip de mode / profil (pill) ─────────── */
  .chip-mode {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    height: var(--control-md);
    padding: 0 var(--space-3);
    border-radius: var(--radius-full);
    font-size: var(--text-label);
    font-weight: 600;
    border: var(--border-width) solid var(--color-border);
    background: var(--color-surface);

    &[aria-selected="true"] {
      border-width: var(--border-width-selected);
      border-color: var(--mode-color, var(--color-primary));
      background: var(--mode-surface, var(--color-primary-surface));
    }
  }

  /* Marche : toujours en trait pointillé sur la carte, quelle que soit la teinte */
  .trace-walk { stroke-dasharray: 4 4; }

  /* Tracé d'itinéraire : halo blanc/sombre 2px pour la lisibilité sur la carte */
  .trace-segment { stroke-width: 4px; paint-order: stroke; stroke: var(--color-surface); }

  /* ── Input ─────────────────────────────────── */
  .input {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    height: var(--control-xl);
    padding: 0 var(--space-4);
    background: var(--color-surface);
    color: var(--color-text);
    font-size: var(--text-corps); /* 16px — évite le zoom iOS */
    border: var(--border-width) solid var(--color-border);
    border-radius: var(--radius-md);
    outline: none;
    transition: border-color var(--dur-base) var(--ease-ui);

    &::placeholder { color: var(--color-text-subtle); }
    &:focus-visible { border-color: var(--color-primary); box-shadow: var(--focus-ring); }
  }

  /* ── Bottom sheet (mobile) — devient un panneau latéral ≥1024px ── */
  /* <div role="dialog" aria-labelledby="sheet-title"> non modal */
  .bottom-sheet {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: var(--color-surface);
    border-radius: var(--radius-2xl) var(--radius-2xl) 0 0;
    box-shadow: var(--shadow-sheet);
    padding: var(--space-2) var(--space-4) var(--space-3);
    transition: transform var(--dur-sheet) var(--ease-ui);

    @media (min-width: 1024px) {
      position: static;
      width: var(--search-panel);
      min-width: 380px;
      border-radius: var(--radius-2xl);
      box-shadow: var(--shadow-card);
    }
  }

  /* ── Modale ────────────────────────────────── */
  /* <div role="dialog" aria-modal="true" aria-labelledby="modal-title"> */
  .modal {
    background: var(--color-surface);
    border-radius: var(--radius-2xl);
    box-shadow: var(--shadow-modal);
    padding: var(--space-6);

    @media (min-width: 1024px) {
      width: var(--modal-width);
      margin-inline: auto;
    }
  }

  /* ── Bottom navigation (mobile) — devient une sidebar ≥1024px ── */
  /* <nav aria-label="Navigation principale"> */
  .bottom-nav {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    padding-bottom: env(safe-area-inset-bottom);
    background: var(--color-surface);
    border-top: var(--border-width) solid var(--color-border);
    display: flex;
    align-items: center;
    justify-content: space-around;

    @media (min-width: 1024px) {
      position: static;
      flex-direction: column;
      justify-content: flex-start;
      align-items: stretch;
      width: var(--nav-rail);
      height: 100vh;
      border-top: none;
      border-right: var(--border-width) solid var(--color-border);
    }
  }

  /* ── Toast ─────────────────────────────────── */
  /* <div role="status" aria-live="polite" aria-atomic="true"> */
  .toast {
    position: fixed;
    left: var(--space-4);
    right: var(--space-4);
    bottom: calc(var(--control-2xl) + env(safe-area-inset-bottom) + var(--space-2));
    background: var(--color-surface);
    border: var(--border-width) solid var(--color-border);
    border-radius: var(--radius-xl);
    padding: var(--space-3) var(--space-4);
    box-shadow: var(--shadow-sheet);
  }

  /* ── Skeleton (chargement) ─────────────────── */
  .skeleton {
    background: linear-gradient(90deg,
      var(--color-surface-sunken) 0%,
      var(--color-surface-muted) 50%,
      var(--color-surface-sunken) 100%);
    background-size: 200% 100%;
    border-radius: var(--radius-sm);
    animation: shimmer 1.5s linear infinite;
  }
  @keyframes shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
}
```
