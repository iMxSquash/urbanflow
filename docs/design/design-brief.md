# Design Brief — UrbanFlow SmartRoute

## Identité du produit

**UrbanFlow SmartRoute** est une PWA de mobilité urbaine pour la métropole nantaise.
Elle s'adresse à des citoyens qui veulent se déplacer de façon plus intelligente et plus verte.

### Positionnement

Ce n't est pas une app gouvernementale froide.
Ce n'est pas une app startup tape-à-l'oeil.
C'est un outil sobre, utile, rassurant — qui donne envie de prendre le vélo plutôt que la voiture.

### Valeurs design

| Valeur | Traduction visuelle |
|--------|-------------------|
| **Sobriété** | Espace blanc généreux, hiérarchie claire, pas d'animations superflues |
| **Confiance** | Données sourcées (ADEME), feedback immédiat, pas d'erreur silencieuse |
| **Éco-responsabilité** | Vert comme couleur primaire, score CO2 toujours visible |
| **Accessibilité** | Contrastes WCAG AA, navigation clavier, tailles de texte lisibles |
| **Mobile-first** | 90% des usages = en déplacement, une main, soleil dans les yeux |

---

## Palette de couleurs

### Sémantique des couleurs

La couleur est fonctionnelle avant d'être décorative.
Chaque mode de transport a sa couleur. Chaque action a sa couleur.

### Tokens primaires

```
eco-green     → #16a34a  (green-600)  Marche, vélo, actions positives, CO2 économisé
transit-blue  → #2563eb  (blue-600)   Tramway, TC, données temps réel
urban-slate   → #334155  (slate-700)  Textes principaux, UI neutre
```

### Tokens d'état

```
warning-amber  → #d97706  (amber-600)  Bus, alertes douces, heure de pointe
danger-red     → #dc2626  (red-600)    Erreurs, CO2 élevé, incidents
success-green  → #15803d  (green-700)  Confirmation, badge débloqué
info-sky       → #0284c7  (sky-600)    Informations neutres
```

### Tokens de mode de transport (carte Leaflet)

```
walk    → #94a3b8  (slate-400)   Gris neutre — marche
bike    → #16a34a  (green-600)   Vert vif — vélo
tram    → #2563eb  (blue-600)    Bleu — tramway
bus     → #d97706  (amber-600)   Ambre — bus
navibus → #0891b2  (cyan-600)    Cyan — navibus Loire
```

### Fond et surfaces

```
background     → #f8fafc  (slate-50)   Fond global
surface        → #ffffff              Cartes, modales, panels
surface-muted  → #f1f5f9  (slate-100) Zones secondaires, inputs
border         → #e2e8f0  (slate-200) Séparateurs
border-strong  → #cbd5e1  (slate-300) Contours actifs
```

### Textes

```
text-primary   → #0f172a  (slate-900) Titres, données importantes
text-secondary → #475569  (slate-600) Corps de texte, labels
text-muted     → #94a3b8  (slate-400) Placeholders, metadata
text-inverse   → #ffffff              Sur fonds colorés
```

---

## Typographie

### Police

**Inter** — Google Fonts, variable font, excellent rendu mobile.

Pas de police décorative. Pas de serif. L'app est un outil, pas un magazine.

### Échelle typographique

```
display   → 2.25rem (36px) / font-bold    → Chiffre CO2 épargné, stats clés
h1        → 1.875rem (30px) / font-bold   → Titre de page
h2        → 1.5rem (24px) / font-semibold → Section header
h3        → 1.25rem (20px) / font-semibold→ Card title, modal title
body-lg   → 1.125rem (18px) / font-normal → Texte important, onboarding
body      → 1rem (16px) / font-normal     → Corps de texte standard
body-sm   → 0.875rem (14px) / font-normal → Labels, metadata
caption   → 0.75rem (12px) / font-normal  → Timestamps, sources
```

### Line-height

- Titres : `leading-tight` (1.25)
- Corps : `leading-relaxed` (1.625)
- UI dense (horaires, stats) : `leading-none` (1)

---

## Espacement — Grille 4px

Base : `4px`. Toutes les valeurs sont des multiples de 4.

```
1  →  4px   micro-espacement (gap entre icône et texte)
2  →  8px   espacement interne compact (badge padding)
3  →  12px  espacement standard composant
4  →  16px  padding card, gap list
5  →  20px  espacement confortable
6  →  24px  section padding mobile
8  →  32px  section padding desktop
10 →  40px  espacement large
12 →  48px  hauteur minimum zone tactile (WCAG)
```

---

## Composants clés — Comportements attendus

### JourneyCard (carte d'itinéraire)

```
┌─────────────────────────────────────────┐
│ 🚲 Vélo → 🚋 Tram ligne 1              │
│ 23 min              ● 4g CO₂  ✦ 85pts │
│ Départ 14:32 · Arrivée 14:55           │
│ [Choisir cet itinéraire]               │
└─────────────────────────────────────────┘
```

- Fond blanc, ombre douce `shadow-sm`
- Border-left colorée selon mode principal
- CO2 toujours visible en couleur (vert si < voiture, rouge si >=)
- Hauteur minimum 80px, zone tactile complète

### StationMarker (marqueur Leaflet)

```
Vélo disponible  : cercle vert plein, chiffre blanc
Vélo indisponible: cercle gris, chiffre blanc
Station vide     : cercle rouge, "0" blanc
```

### BadgeCard (gamification)

```
Débloqué  : fond vert-50, icône colorée, border vert
Verrouillé: fond slate-50, icône grisée, border slate, opacity 60%
```

### ScoreCO2 (chiffre principal dashboard)

```
Positif (économie) : texte vert-700, fond vert-50
Neutre             : texte slate-700
```

---

## Règles d'animation

Éco-conception oblige : **minimum vital**.

```
transition durée  → 150ms (interactions) / 300ms (apparition)
transition easing → ease-out
```

Autorisé :
- Fade-in d'une carte (opacity 0→1, 150ms)
- Slide-up d'une modal (translateY 8px→0, 200ms)
- Badge débloqué : scale 0.95→1 + opacity, 300ms

Interdit :
- Scroll animations (lenis, GSAP ScrollTrigger)
- Animations en boucle
- Parallaxe
- Tout ce qui consomme du GPU inutilement

---

## Mobile-first — Règles clés

- Taille tactile minimum : 48px × 48px (WCAG 2.5.5)
- Padding horizontal minimum : 16px
- Texte minimum : 16px (évite le zoom auto iOS)
- Pas de hover-only interaction (tout est accessible au tap)
- La carte Leaflet fait toujours 100% de la largeur
- Les JourneyCards s'empilent verticalement sur mobile

---

## Accessibilité — Engagements

- WCAG 2.1 AA minimum sur tous les composants
- Ratio contraste texte normal : ≥ 4.5:1
- Ratio contraste texte large (≥ 18px bold) : ≥ 3:1
- Focus visible sur tous les éléments interactifs (`focus:ring-2 focus:ring-eco`)
- Pas de couleur seule pour transmettre une information (icône + couleur)
- `prefers-reduced-motion` respecté pour toutes les animations