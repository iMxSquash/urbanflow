# UrbanFlow SmartRoute — Guide de maquette Figma
> Design système atomique complet · Mobile-first PWA · Renouveau visuel 2.0

---

## Vision & Direction créative

**Concept : "Urban Night"**
UrbanFlow 2.0 adopte une identité sombre et premium — à l'image d'une ville la nuit vue depuis un tramway. La carte devient l'environnement vivant de l'application, pas juste un composant. Le vert éco-responsable pulse comme signal vital. Chaque action a du poids, du feedback, de l'intention.

**3 principes directeurs**
1. **Map-first** — La carte occupe 100% de l'écran. Tout le reste se superpose en couches flottantes.
2. **Frictionless** — L'utilisateur lance un itinéraire en 2 taps. Zéro écrans intermédiaires inutiles.
3. **Rewarding** — Chaque trajet éco génère une récompense visible, immédiate, satisfaisante.

---

## 1. Fondations — Design Tokens

### 1.1 Palette de couleurs

#### Surfaces (sombres)
| Token | Hex | Usage |
|-------|-----|-------|
| `--bg-deep` | `#060C08` | Fond racine, splash screen |
| `--bg-base` | `#0C1510` | Fond principal des pages |
| `--bg-elevated` | `#142218` | Cartes, panneaux |
| `--bg-card` | `#1C2E20` | Cartes internes, items de liste |
| `--bg-overlay` | `rgba(6,12,8,0.85)` | Scrim de modales |

#### Texte
| Token | Hex | Contraste sur `--bg-elevated` |
|-------|-----|-------------------------------|
| `--text-primary` | `#F0FDF4` | 14.2:1 ✅ AAA |
| `--text-secondary` | `#BBF7D0` | 8.4:1 ✅ AAA |
| `--text-muted` | `#6EE7B7` | 4.6:1 ✅ AA |
| `--text-disabled` | `#4D6B55` | 2.1:1 ⚠ disabled only |

#### Accents
| Token | Hex | Usage |
|-------|-----|-------|
| `--accent-eco` | `#4ADE80` | CTA primaires, succès, éco |
| `--accent-eco-glow` | `rgba(74,222,128,0.15)` | Glow derrière boutons primaires |
| `--accent-eco-dim` | `rgba(74,222,128,0.12)` | Fond de chips eco |
| `--accent-transit` | `#60A5FA` | Actions transit, liens |
| `--accent-transit-dim` | `rgba(96,165,250,0.12)` | Fond chips transit |

#### Modes de transport (identité visuelle immuable)
| Mode | Hex | Nom token |
|------|-----|-----------|
| Marche | `#94A3B8` | `--mode-walk` |
| Vélo | `#4ADE80` | `--mode-bike` |
| Tramway | `#818CF8` | `--mode-tram` |
| Bus | `#FCD34D` | `--mode-bus` |
| Trottinette | `#22D3EE` | `--mode-scooter` |
| Navibus | `#38BDF8` | `--mode-navibus` |
| Train | `#A78BFA` | `--mode-train` |

#### Sémantique
| Token | Hex | Ratio sur bg-elevated | Usage |
|-------|-----|----------------------|-------|
| `--success` | `#22C55E` | 7.25:1 ✅ AAA | Validation, badge unlocked |
| `--warning` | `#F59E0B` | 7.69:1 ✅ AAA | Retard, alerte météo |
| `--error` | `#EF4444` | 4.39:1 ⚠ AA large seulement | Bordures, icônes, fond chip erreur — **pas en texte normal** |
| `--error-text` | `#F87171` | 5.97:1 ✅ AA | Texte de message d'erreur |
| `--info` | `#3B82F6` | 4.49:1 ⚠ AA large seulement | Bordures, icônes, fond chip info — **pas en texte normal** |
| `--info-text` | `#93C5FD` | 9.16:1 ✅ AAA | Texte de message d'info |

> **Règle** : utiliser `--error` / `--info` pour les éléments graphiques (bordures, icônes, chips). Utiliser `--error-text` / `--info-text` pour tout texte lisible ≤ 17px.

#### Bordures
| Token | Valeur | Usage |
|-------|--------|-------|
| `--border` | `rgba(255,255,255,0.07)` | Bordures cartes standard |
| `--border-strong` | `rgba(255,255,255,0.13)` | Bordures actives, focus |
| `--border-eco` | `rgba(74,222,128,0.25)` | Bordures éco |

---

### 1.2 Typographie

**Police unique : Inter** (variable font, déjà installée)

| Token | Size | Weight | Line-height | Usage |
|-------|------|--------|-------------|-------|
| `--text-display` | 32px | 800 | 1.1 | Chiffres dashboard |
| `--text-h1` | 26px | 700 | 1.2 | Titres de page |
| `--text-h2` | 20px | 600 | 1.3 | Titres de section |
| `--text-h3` | 17px | 600 | 1.4 | Sous-titres, labels forts |
| `--text-body-lg` | 16px | 400 | 1.5 | Corps principal |
| `--text-body` | 15px | 400 | 1.5 | Corps standard |
| `--text-body-sm` | 13px | 400 | 1.4 | Descriptions, méta |
| `--text-caption` | 11px | 500 | 1.3 | Labels uppercase, badges |
| `--text-mono` | 15px | 500 | 1.4 | Chiffres (tabular nums) |

**Règles typo critiques :**
- Chiffres de dashboard → `font-variant-numeric: tabular-nums`
- Labels de catégorie → `letter-spacing: 0.08em; text-transform: uppercase`
- Corps de texte → `letter-spacing: -0.01em` (Inter légèrement serré = premium)

---

### 1.3 Spacing (base 4px)

```
4px  → micro-gap (icon + label)
8px  → gap interne composant
12px → padding compact (chips, badges)
16px → padding standard (cartes, inputs)
20px → gap entre éléments de liste
24px → padding section
32px → gap entre sections
48px → marge top page
```

---

### 1.4 Rayons de bordure

| Token | Valeur | Usage |
|-------|--------|-------|
| `--radius-sm` | 6px | Chips, tags, badges |
| `--radius-md` | 12px | Inputs, cartes |
| `--radius-lg` | 16px | Panneaux, bottom sheets |
| `--radius-xl` | 24px | Modales, overlay cards |
| `--radius-full` | 9999px | Pills, avatars, toggles |

---

### 1.5 Ombres & élévation

```
Level 0 → pas d'ombre (éléments inline)
Level 1 → box-shadow: 0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.3)
Level 2 → box-shadow: 0 4px 12px rgba(0,0,0,0.5), 0 2px 4px rgba(0,0,0,0.3)
Level 3 → box-shadow: 0 12px 32px rgba(0,0,0,0.6), 0 4px 8px rgba(0,0,0,0.4)
Level 4 → box-shadow: 0 24px 48px rgba(0,0,0,0.7)  (modales)

Glow eco → box-shadow: 0 0 20px rgba(74,222,128,0.3), 0 0 40px rgba(74,222,128,0.1)
Glow transit → box-shadow: 0 0 20px rgba(96,165,250,0.25)
```

---

### 1.5b — Accessibilité couleur (WCAG 1.4.1 Use of Color)

> Les chips de mode utilisent couleur + icône SVG. La couleur seule n'est jamais le seul vecteur d'information.

| Mode | Chip : icône SVG requise | Icône Lucide suggérée |
|------|--------------------------|----------------------|
| Marche | footprints ou person-walking | `footprints` |
| Vélo | bike | `bike` |
| Tramway | tram (custom) ou train-front | `train-front` |
| Bus | bus | `bus` |
| Trottinette | scooter (custom) ou zap | `zap` |
| Navibus | ship | `ship` |
| Train | train | `train` |

---

### 1.6 Motion tokens

| Token | Valeur | Usage |
|-------|--------|-------|
| `--ease-out` | `cubic-bezier(0.16,1,0.3,1)` | Entrée d'éléments |
| `--ease-in` | `cubic-bezier(0.4,0,1,1)` | Sortie d'éléments |
| `--ease-bounce` | `cubic-bezier(0.34,1.56,0.64,1)` | Badge unlock, success |
| `--dur-fast` | `120ms` | Press feedback |
| `--dur-normal` | `200ms` | Transitions UI |
| `--dur-slow` | `300ms` | Bottom sheet, modales |
| `--dur-xslow` | `400ms` | Transitions de page |

---

### 1.7 Z-index

```
0    → Carte Leaflet
10   → Overlays carte (badges, contrôles)
20   → Bottom sheet (journey results)
30   → Bottom navigation
40   → Modales / drawers
50   → Toasts
60   → Splash / onboarding
```

---

## 1.8 Light Mode — "Urban Day"

> Le dark mode "Urban Night" est le mode **par défaut**. Le light mode est disponible via le toggle dans Paramètres (stocké en Zustand + `localStorage` + `data-theme` sur `<html>`).

### Palette light — Correspondances dark → light

| Rôle | Dark "Urban Night" | Light "Urban Day" | Contraste light (sur blanc) |
|------|--------------------|-------------------|-----------------------------|
| Fond racine | `#060C08` | `#ECFDF5` | — |
| Fond page | `#0C1510` | `#F7FFF9` | — |
| Carte (elevated) | `#142218` | `#FFFFFF` | — |
| Carte imbriquée | `#1C2E20` | `#F0FDF4` | — |
| Texte principal | `#F0FDF4` | `#052E16` | **14.91:1 ✅ AAA** |
| Texte secondaire | `#BBF7D0` | `#14532D` | **9.11:1 ✅ AAA** |
| Texte atténué | `#6EE7B7` | `#166534` | **7.13:1 ✅ AAA** |
| Accent bouton CTA | `#4ADE80` (bg), `#060C08` (text) | `#166534` (bg), `#FFFFFF` (text) | 7.13:1 ✅ AAA |
| Lien / action | `#60A5FA` | `#1D4ED8` | **6.70:1 ✅ AA** |
| Succès texte | `#22C55E` | `#15803D` | **5.02:1 ✅ AA** |
| Erreur texte | `#F87171` | `#DC2626` | **4.83:1 ✅ AA** |
| Info texte | `#93C5FD` | `#1D4ED8` | **6.70:1 ✅ AA** |
| Bordure | `rgba(255,255,255,0.07)` | `rgba(5,46,22,0.10)` | — |

### Chips de mode en light — couleurs de texte foncées

En light mode, les chips n'utilisent plus la couleur vive comme texte (trop peu de contraste sur fond clair). On utilise une version foncée de chaque couleur de mode :

| Mode | Couleur vive (bg chip) | Texte light mode | Contraste |
|------|------------------------|-----------------|-----------|
| Marche | `#94A3B8` (dim 15%) | `#374151` | **9.09:1 ✅ AAA** |
| Vélo | `#4ADE80` (dim 15%) | `#15803D` | **4.57:1 ✅ AA** |
| Tramway | `#818CF8` (dim 15%) | `#4338CA` | **6.81:1 ✅ AA** |
| Bus | `#FCD34D` (dim 15%) | `#92400E` | **6.67:1 ✅ AA** |
| Trottinette | `#22D3EE` (dim 15%) | `#155E75` | **6.54:1 ✅ AA** |
| Navibus | `#38BDF8` (dim 15%) | `#0369A1` | **5.28:1 ✅ AA** |
| Train | `#A78BFA` (dim 15%) | `#6D28D9` | **6.19:1 ✅ AA** |

### Carte Leaflet en light

| Mode | Tuile | URL |
|------|-------|-----|
| Dark | CartoDB Dark Matter | `basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png` |
| Light | CartoDB Positron | `basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png` |

La couleur du marqueur GPS reste `#4ADE80` — fonctionne sur les deux fonds de carte.

### Ce qui ne change PAS en light

- Les couleurs des segments sur la carte (`--mode-*`) restent identiques — elles sont appliquées sur les polylines Leaflet, pas sur des fonds blancs
- Le marqueur GPS (anneau vert) — lisible sur Positron
- Les animations et la structure de layout — identiques
- Les tokens de spacing, radius, motion — identiques

### Implémentation Zustand + DOM

```typescript
// stores/theme.store.ts
type Theme = 'dark' | 'light' | 'system'

const applyTheme = (theme: Theme) => {
  const resolved = theme === 'system'
    ? (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark')
    : theme
  document.documentElement.dataset.theme = resolved
}
```

---

## 2. Atomes

### A1 — Bouton primaire (CTA éco)

**Spec visuelle :**
```
┌─────────────────────────────────┐
│  ●  Calculer l'itinéraire       │
└─────────────────────────────────┘
```
- Background : `--accent-eco`
- Texte : `#060C08` (noir sur vert)
- Hauteur : 52px
- Border-radius : `--radius-md` (12px)
- Font : 16px 600
- Icône optionnelle : 20px, gap 8px
- Glow : `box-shadow: 0 0 20px rgba(74,222,128,0.35)`
- Hover/Press : `scale(0.97)` + glow réduit, 120ms `--ease-out`
- Disabled : `opacity: 0.35`, `cursor: not-allowed`, pas de glow
- Loading : spinner blanc inline (icône remplacée)

### A2 — Bouton secondaire (ghost)

- Background : `transparent`
- Bordure : `1px solid --border-strong`
- Texte : `--text-primary`
- Hover : `background: rgba(255,255,255,0.05)`
- Même hauteur que primaire

### A3 — Bouton icône (map control)

```
╔════╗
║ ⊕  ║   44×44px min
╚════╝
```
- Background : `--bg-card`
- Border : `1px solid --border`
- Border-radius : `--radius-md`
- Backdrop-filter : `blur(12px)`
- Icône : 20px, `--text-secondary`
- Hover : `border-color: --border-strong`
- Active : `background: --bg-elevated`

### A4 — Input texte

```
┌──────────────────────────────────────┐
│ 🔍  Rechercher une adresse...        │
└──────────────────────────────────────┘
```
- Background : `--bg-elevated`
- Border : `1px solid --border`
- Border-radius : `--radius-md`
- Hauteur : 52px
- Padding : 16px
- Font : 16px (évite le zoom iOS)
- Focus : `border-color: --accent-eco`, `box-shadow: 0 0 0 3px rgba(74,222,128,0.2)`
- Placeholder : `--text-muted`
- Icône préfixe : 20px, gap 12px

### A5 — Badge / Chip de mode

```
 ┌──────────┐  ┌──────────┐  ┌──────────┐
 │ 🚋 Tram  │  │ 🚲 Vélo  │  │ 🚶 15min │
 └──────────┘  └──────────┘  └──────────┘
```
- Hauteur : 32px
- Padding : 8px 12px
- Border-radius : `--radius-full`
- Background : `rgba(MODE_COLOR, 0.12)` avec `border: 1px solid rgba(MODE_COLOR, 0.3)`
- Texte : `MODE_COLOR` à 100%
- Font : 13px 500

### A6 — Chip éco (CO2)

```
 ┌──────────────────┐
 │ 🌿  -2.4 kg CO₂  │
 └──────────────────┘
```
- Background : `--accent-eco-dim`
- Border : `1px solid --border-eco`
- Texte : `--accent-eco`
- Icône feuille SVG (pas emoji)

### A7 — Badge de déblocage

```
     ╔═════════════╗
     ║  🏆         ║
     ║  Cycliste   ║
     ║  Assidu     ║
     ╚═════════════╝
```
- Taille : 80×96px
- Background : radial-gradient depuis `rgba(74,222,128,0.15)` vers `--bg-card`
- Icône : 32px SVG (pas emoji dans le code — Lucide `award`, `bike`, `leaf`, etc.)
- Border : `1px solid --border-eco` si débloqué, `--border` si verrouillé
- Verrouillé : `filter: grayscale(1) opacity(0.35)`
- Unlock animation : `scale(0.9) → scale(1.05) → scale(1)` + glow eco, 400ms `--ease-bounce`

### A8 — Toggle switch

```
 ┌──────────────────────────┐
 │ Lignes TAN    ⬛⬜⬜⬛   │
 └──────────────────────────┘
```
- Off : `--bg-card` avec thumb gris
- On : `--accent-eco` avec thumb blanc
- Largeur : 44px, hauteur : 26px
- Transition : 200ms `--ease-out`
- Touch target : 44×44px (padding autour du toggle)

### A9 — Spinner

```
  ◌  →  ◔  →  ◑  →  ◕  →  ●
```
- Couleur : `--accent-eco`
- Taille : 20px (inline) / 32px (page)
- Animation : rotation 0.8s linear infinite
- Fond du track : `rgba(74,222,128,0.15)`

### A10 — Skeleton loader

- Background : `--bg-card`
- Animation : shimmer gauche→droite, `rgba(255,255,255,0.06)` 1.5s linear infinite
- Border-radius : hérite du composant parent

---

## 3. Molécules

### M1 — Barre de recherche flottante

```
┌────────────────────────────────────────────────┐
│ ◎  Ma position                            ✕    │
├────────────────────────────────────────────────┤
│ 🔍  Où allez-vous ?                            │
└────────────────────────────────────────────────┘
```
- Flottant sur la carte : `position: absolute; top: env(safe-area-inset-top) + 12px`
- Largeur : calc(100% - 24px), centré
- Background : `--bg-elevated` + `backdrop-filter: blur(16px)`
- Border : `1px solid --border`
- Border-radius : `--radius-lg`
- Elevation : Level 3
- Séparateur entre les deux champs : `1px solid --border`
- Le point de départ est pré-rempli (position GPS ou adresse saisie)
- Bouton `✕` = effacer destination + fermer résultats

### M2 — Sélecteur date/heure

```
┌───────────────────────────────────────────────┐
│  [Départ ▼]        mar. 3 juin · 14:30  ›     │
└───────────────────────────────────────────────┘
```
- Hauteur : 44px
- Fond : `--bg-card`
- Border-radius : `--radius-md`
- Pill "Départ/Arrivée" : switch à gauche, 32px hauteur
- Date+heure : `--text-secondary`, font-mono pour l'heure
- Chevron : `--text-muted`

### M3 — Carte d'itinéraire (résultat)

```
┌─────────────────────────────────────────────────┐
│ ★ RECOMMANDÉ                           38 min   │
│                                                 │
│ ━━●━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━●━━━━●        │
│   🚋        🚲      🚶                          │
│ Commerce  Bellamy  Decré                        │
│                                                 │
│ ┌───────────┐ ┌───────────┐ ┌──────────────┐   │
│ │🌿 2.1 kg  │ │⚡ Rapide  │ │💰 1.70€ est. │   │
│ └───────────┘ └───────────┘ └──────────────┘   │
└─────────────────────────────────────────────────┘
```
- Background : `--bg-elevated`
- Border : `1px solid --border`
- Border-radius : `--radius-lg`
- Hauteur : variable (~120px)
- Badge "RECOMMANDÉ" : `--accent-eco`, 11px uppercase, letter-spacing 0.08em
- Timeline segments : colorés par mode (`--mode-*`), épaisseur 3px
- Les 3 chips en bas : M5 (CO2), variante info (rapidité), variante neutre (prix)
- Sélectionné : `border-color: --accent-eco`, `box-shadow: 0 0 0 1px --accent-eco`

### M4 — Segment de trajet (dans le panel détail)

```
│ 14:32                                            │
│  ●──────────────────────────────────  14:47      │
│  │  🚋 Tramway ligne 3                           │
│  │  Commerce → Italique                          │
│  │  Départ dans ~5 min · 2 prochains : 14:39, 14:46 │
│  ●                                               │
│ 14:47  Italique — correspondance (3 min marche)  │
```
- Ligne verticale : `--mode-tram` (#818CF8)
- Heure : `--text-mono`, `--text-secondary`
- Icône mode : SVG 16px dans circle 28px, fond `rgba(MODE_COLOR, 0.15)`
- Texte arrêt : `--text-primary` 15px
- Méta (durée, prochain passage) : `--text-muted` 13px

### M5 — Stat card (dashboard)

```
┌──────────────────────────┐
│  CO₂ économisé           │
│  2.4 kg                  │  ◄── chiffre display 32px
│  +18% vs mois dernier    │  ◄── trend en vert
└──────────────────────────┘
```
- Background : `--bg-elevated`
- Border-left : `3px solid MODE_COLOR` ou `--accent-eco`
- Hauteur : 88px
- Chiffre : `--text-display`, `font-variant-numeric: tabular-nums`
- Trend positif : `--success` + icône arrow-up 12px
- Trend négatif : `--error` + icône arrow-down

### M6 — Item de navigation (bottom nav)

```
     ╔═══╗
     ║ 🗺 ║
     ║Carte║
     ╚═══╝
```
- Zone active : 48×56px (touch target)
- Icône : 24px SVG
- Label : 11px 500, letter-spacing 0.03em
- Inactif : icône `--text-muted`, label `--text-muted`
- Actif : icône `--accent-eco`, label `--accent-eco`, indicateur dot 4px `--accent-eco` sous label
- Pas de fond coloré sur l'item actif (l'indicateur point suffit)

### M7 — Badge météo (flottant carte)

```
╔══════════════╗
║ ⛅  16°C     ║
╚══════════════╝
```
- 72×40px
- Fond : `--bg-elevated` + blur
- Border : `1px solid --border`
- Border-radius : `--radius-full`
- Icône météo : 20px SVG (sun, cloud-rain, cloud-snow, etc.)
- Température : 15px 600 `--text-primary`

### M8 — Toast de récompense

```
┌────────────────────────────────────┐
│  🏅  +120 pts  ·  2,4 kg CO₂ évités│
│  [Badge débloqué : Cycliste Assidu]│
└────────────────────────────────────┘
```
- Position : bas de l'écran, au-dessus de la bottom nav, marge 8px
- Largeur : calc(100% - 32px), centré
- Background : `--bg-card` + `border: 1px solid --accent-eco`
- Icône éco : 24px
- Auto-dismiss : 5s
- Animation : slide-up 300ms `--ease-out`, fade-out 200ms

---

## 4. Organismes

### O1 — Bottom Navigation Bar

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│   🗺        🔍        📊        👤                  │
│  Carte   Trajets   Stats    Profil                  │
│                                                     │
└─────────────────────────────────────────────────────┘
```
- Hauteur : 64px + `env(safe-area-inset-bottom)`
- Background : `--bg-base` + `backdrop-filter: blur(20px)`
- Border-top : `1px solid --border`
- 4 items maximum : Carte / Trajets / Stats / Profil
- Position : `fixed; bottom: 0; left: 0; right: 0`
- Z-index : 30

### O2 — En-tête de carte (floating top bar)

```
┌─────────────────────────────────────────────────┐
│  UrbanFlow                    [Bicloo] [TAN] [⊕] │
└─────────────────────────────────────────────────┘
```
- Hauteur : 56px + `env(safe-area-inset-top)`
- Background : gradient `--bg-deep → transparent`
- Logo : "UrbanFlow" 17px 700 `--text-primary`
- Contrôles couches : 3 boutons icône (A3) empilés à droite
- Disparaît (slide-up) quand la search bar est active et clavier ouvert

### O3 — Panel résultats (bottom sheet)

```
   ┌─────────────────────────────────────┐
   │ ────  (drag handle)                 │
   │                                     │
   │ 3 itinéraires trouvés               │
   │                                     │
   │  [Carte M3 — itinéraire 1]          │
   │  [Carte M3 — itinéraire 2]          │
   │  [Carte M3 — itinéraire 3]          │
   │                                     │
   └─────────────────────────────────────┘
```
- Mobile : bottom sheet, hauteur max 65vh
- Handle : `32×4px`, `--border-strong`, centré, marge top 12px
- Background : `--bg-base`
- Border-radius top : `--radius-xl`
- Elevation : Level 4
- Peut se swiper vers le haut (100vh) pour voir plus
- Animation : `translateY(100%) → translateY(0)` 300ms `--ease-out`
- Desktop : sidebar droite 360px, hauteur 100vh

### O4 — Panel détail itinéraire (bottom sheet expandé)

```
   ┌──────────────────────────────────────┐
   │ ←  Retour     Commerce → Chantenay   │
   │────────────────────────────────────  │
   │  🌿 2.4 kg · ⚡ 38 min · ★ Score 87  │
   │                                      │
   │  [Segment 1 — M4]                    │
   │  [Segment 2 — M4]                    │
   │  [Segment 3 — M4]                    │
   │                                      │
   │  ┌────────────────────────────────┐  │
   │  │  Partir maintenant  →          │  │
   │  └────────────────────────────────┘  │
   └──────────────────────────────────────┘
```
- Hauteur : 70vh en mobile, expandable à 90vh
- Header sticky dans le panel (pas dans le viewport)
- Bouton "Partir maintenant" : CTA primaire A1, sticky en bas du panel
- Score visuel : jauge circulaire 48px ou nombre coloré

### O5 — Grille de badges

```
 ┌───────────┐  ┌───────────┐  ┌───────────┐
 │  🏆       │  │  🚲       │  │  🌿       │
 │ Premier   │  │ Cycliste  │  │ Éco-       │
 │ Trajet    │  │ Assidu    │  │ guerrier  │
 └───────────┘  └───────────┘  └───────────┘
 ┌───────────┐  ┌───────────┐  ┌───────────┐
 │  🔒       │  │  🔒       │  │  🔒       │
 │ ...       │  │ ...       │  │ ...       │
 └───────────┘  └───────────┘  └───────────┘
```
- Grille 3 colonnes
- Badges débloqués en haut (triés par date récente)
- Badges verrouillés en bas, désaturés
- Tap sur un badge → bottom sheet avec description + progression

### O6 — Section stats du dashboard

```
┌────────────────────────────────────────────────┐
│  Ce mois                                       │
│                                                │
│  ┌──────────────┐  ┌──────────────┐            │
│  │ CO₂ économisé│  │   Trajets    │            │
│  │   2.4 kg     │  │     12       │            │
│  │ +18% ↑       │  │ +3 vs m-1    │            │
│  └──────────────┘  └──────────────┘            │
│  ┌──────────────┐                              │
│  │    Points    │                              │
│  │    1 240     │                              │
│  │   Rang : 🥈  │                              │
│  └──────────────┘                              │
│                                                │
│  [Graphique barres CO2 hebdo — Recharts]       │
│  [Graphique donut modes utilisés — Recharts]   │
└────────────────────────────────────────────────┘
```

---

## 5. Écrans — Wireframes détaillés

> **Convention wireframe**
> - `[ ]` = bouton / tap target
> - `( )` = input
> - `{ }` = composant réutilisable
> - `░░░` = image / carte / skeleton
> - `───` = séparateur

---

### Écran 0 — Splash Screen

**Contexte :** 1ère ouverture ou chargement initial.

```
┌─────────────────────────────────────────────┐
│ (status bar)                                │
│                                             │
│                                             │
│                                             │
│                  UrbanFlow                  │
│            ●  (logo SVG feuille+route)      │
│                                             │
│          "Votre mobilité, repensée"         │
│                                             │
│                 ░░░░░░░░░                   │
│              (barre de chargement)          │
│                                             │
│                                             │
│                                             │
│                                             │
│                Nantes Métropole             │
└─────────────────────────────────────────────┘
```

**Specs :**
- Fond : `--bg-deep` (#060C08)
- Logo : 64×64px, combinaison icône SVG (feuille stylisée + route) + wordmark
- Wordmark : 28px 700 `--text-primary`
- Tagline : 15px 400 `--text-muted`
- Barre de chargement : gradient animé `--accent-eco`, `border-radius: full`, 240×3px
- Durée : 1.5s max, puis transition vers Onboarding ou Carte
- Animation : fade-in du logo 400ms delay 200ms

---

### Écran 1 — Consentement géolocalisation (Onboarding RGPD)

**Contexte :** Première fois ou consentement révoqué. Se superpose en modale plein écran.

```
┌─────────────────────────────────────────────┐
│                                             │
│                                             │
│           ╔═══════════════════╗             │
│           ║                   ║             │
│           ║   📍              ║             │
│           ║  (icône GPS SVG   ║             │
│           ║   animée, pulse)  ║             │
│           ║                   ║             │
│           ╚═══════════════════╝             │
│                                             │
│      Votre position, sous contrôle          │
│                                             │
│   UrbanFlow a besoin de votre position      │
│   pour calculer vos itinéraires depuis      │
│   votre emplacement actuel.                 │
│                                             │
│   ✓  Données GPS jamais partagées           │
│   ✓  Utilisées uniquement pendant le trajet │
│   ✓  Désactivable à tout moment             │
│                                             │
│   [ Autoriser la géolocalisation  → ]       │
│                                             │
│   [ Saisir mon adresse manuellement ]       │
│                                             │
│        Politique de confidentialité         │
└─────────────────────────────────────────────┘
```

**Specs :**
- Fond : `--bg-overlay` (85% opacité) sur fond carte
- Panneau : `--bg-elevated`, `border-radius: --radius-xl`, padding 32px 24px
- Icône : 64px dans cercle 96px fond `--accent-eco-dim`
- Animation : pulsation glow eco 2s infinite
- Titre : 22px 700 `--text-primary`
- Body : 15px 400 `--text-secondary`
- Liste checks : icône check-circle 16px `--accent-eco`, gap 8px
- CTA primaire : A1 pleine largeur
- CTA secondaire : A2 pleine largeur
- Lien : `--text-muted` 13px, underline

---

### Écran 2 — Connexion

```
┌─────────────────────────────────────────────┐
│ (status bar)                                │
│                                             │
│   ←  (back — si depuis register)            │
│                                             │
│   UrbanFlow  ●                              │
│                                             │
│   Bon retour !                              │
│   Connectez-vous pour continuer             │
│                                             │
│   Email                                     │
│   ┌────────────────────────────────────┐    │
│   │  ✉  votre@email.com               │    │
│   └────────────────────────────────────┘    │
│                                             │
│   Mot de passe                              │
│   ┌────────────────────────────────────┐    │
│   │  🔒  ••••••••••          [ 👁 ]   │    │
│   └────────────────────────────────────┘    │
│                                             │
│   [ Se connecter → ]                        │
│                                             │
│   ─────────── ou ───────────                │
│                                             │
│   Pas encore de compte ?                    │
│   [ Créer un compte ]                       │
│                                             │
│                                             │
└─────────────────────────────────────────────┘
```

**Specs :**
- Fond : `--bg-base` (pas de carte en arrière-plan)
- Logo + wordmark : 36px haut de page
- Titre : 26px 700 `--text-primary`
- Sous-titre : 15px 400 `--text-muted`
- Inputs : A4, label visible au-dessus
- Toggle password : bouton icône 44×44px
- CTA : A1 pleine largeur
- Lien "Créer un compte" : A2 pleine largeur
- États de validation :
  - Email invalide → bordure `--error`, message sous le champ
  - Loading submit → CTA désactivé + spinner inline
  - Erreur API → banner rouge en haut du formulaire

---

### Écran 3 — Inscription

```
┌─────────────────────────────────────────────┐
│ ←                                           │
│                                             │
│   Créer votre compte                        │
│   Rejoignez les éco-voyageurs de Nantes     │
│                                             │
│   Nom                                       │
│   ┌────────────────────────────────────┐    │
│   │  👤  Votre nom                     │    │
│   └────────────────────────────────────┘    │
│                                             │
│   Email                                     │
│   ┌────────────────────────────────────┐    │
│   └────────────────────────────────────┘    │
│                                             │
│   Mot de passe  (min. 8 caractères)         │
│   ┌────────────────────────────────────┐    │
│   └────────────────────────────────────┘    │
│                                             │
│   ░░░░░░░░░░░░░░  Indicateur de force       │
│                                             │
│   [ Créer mon compte → ]                    │
│                                             │
│   Déjà un compte ? Se connecter             │
└─────────────────────────────────────────────┘
```

**Specs :**
- Indicateur force mdp : barre 4 segments, couleurs `--error → --warning → --success`
- Les champs apparaissent progressivement (progressive disclosure) — non : tout montrer d'emblée ici car simple

---

### Écran 4 — Carte principale (état vide / initial)

**Contexte :** Utilisateur connecté, GPS accordé, aucun itinéraire calculé.

```
┌─────────────────────────────────────────────┐
│(safe-area top)                              │
│ UrbanFlow                    [🚲][🚌][⊕]   │ ◄ O2
│                                             │
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   │
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   │
│ ░░░░░░ CARTE NANTES DARK TILES ░░░░░░░░░   │
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   │
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   │
│ ░░░░░░░░░░░░░░ ◎ (user pos) ░░░░░░░░░░░░   │
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   │
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   │
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   │
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   │
│                              ⛅ 16°C        │ ◄ M7
│ ┌─────────────────────────────────────────┐ │
│ │ ◎  Ma position actuelle           ›  › │ │ ◄ M1 (tap → search)
│ └─────────────────────────────────────────┘ │
│                                             │
│ [🗺 Carte] [🔍 Trajets] [📊 Stats] [👤 Moi] │ ◄ O1
│ (safe-area bottom)                          │
└─────────────────────────────────────────────┘
```

**Specs :**
- Tuiles carte : CartoDB Dark Matter (thème sombre) → `https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png`
- Marqueur utilisateur : cercle `--accent-eco` 16px + anneau pulsant 32px (animation eco-pulse)
- Barre de recherche : fixée en bas, au-dessus de la nav bar (16px au-dessus)
- Width : `calc(100% - 32px)`, centré
- Tap sur la barre → agrandit en M1 complet (animation expand)

---

### Écran 5 — Carte · Mode recherche

**Contexte :** L'utilisateur tape dans "Où allez-vous ?"

```
┌─────────────────────────────────────────────┐
│(safe-area top)                              │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ ◎  Ma position actuelle          [ ✕ ] │ │
│ ├─────────────────────────────────────────┤ │
│ │ 🔍  Où allez-vous ?                     │ │ ◄ focus + clavier
│ └─────────────────────────────────────────┘ │
│                                             │
│ ─────────────────────────────────────────── │
│ Suggestions                                 │
│                                             │
│  📍  Île de Nantes, Nantes                  │
│  📍  Gare de Nantes, Place de la Gare       │
│  📍  CHU de Nantes, 1 Place Alexis Ricordeau│
│  ───────────────────────────────────────── │
│  🕐  Castellane                   (récent)  │
│  🕐  Stade de la Beaujoire         (récent) │
│                                             │
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │ ◄ carte réduite (~30vh)
│                                             │
└─────────────────────────────────────────────┘
```

**Specs :**
- La liste de suggestions remonte depuis le bas (keyboard avoid)
- Icône épingle : `--accent-eco` pour les résultats géocodés
- Icône horloge : `--text-muted` pour les récents
- Hauteur item : 52px (touch target)
- Séparateur visuel entre résultats géo et historique
- Highlight du texte tapé en `--accent-eco` dans les suggestions
- Tap suggestion → ferme clavier → lance calcul → Écran 6

---

### Écran 6 — Carte · Résultats itinéraires

```
┌─────────────────────────────────────────────┐
│(safe-area top)                              │
│ UrbanFlow                    [🚲][🚌][⊕]   │
│                                             │
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   │
│ ░░░░░░░░░░░░ CARTE + TRACÉ ░░░░░░░░░░░░░   │ ◄ tracés colorés par mode
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   │
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   │
│                                             │
│ ┌─ (handle) ────────────────────────────┐  │
│ │                                       │  │
│ │  Commerce → Chantenay                  │  │
│ │  3 options · mar. 3 juin, départ 14:30 │  │
│ │                                       │  │
│ │  {M3 — Itinéraire 1 — RECOMMANDÉ}     │  │
│ │  {M3 — Itinéraire 2}                  │  │
│ │  {M3 — Itinéraire 3}                  │  │
│ │                                       │  │
│ └───────────────────────────────────────┘  │
│                                             │
│ [🗺 Carte] [🔍 Trajets] [📊 Stats] [👤 Moi] │
└─────────────────────────────────────────────┘
```

**Specs :**
- Bottom sheet (O3) : 60vh de hauteur, scrollable
- Tracé sur carte : segments colorés par mode, épaisseur 4px, opacité 0.9
- Itinéraire non sélectionné : opacité réduite (0.35) sur la carte
- 3 cartes M3 empilées avec gap 12px, scroll vertical dans le sheet
- Titre du sheet : `--text-primary` 17px 600, meta `--text-muted` 13px
- Tap carte → Écran 7

---

### Écran 7 — Carte · Détail itinéraire

```
┌─────────────────────────────────────────────┐
│(safe-area top)                              │
│ UrbanFlow                    [🚲][🚌][⊕]   │
│                                             │
│ ░░░░░░░░░░░ CARTE + TRACÉ SÉLECTIONNÉ ░░░  │
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   │
│                                             │
│ ┌─ (handle) ────────────────────────────┐  │
│ │ ←  Retour aux options                 │  │
│ │                                       │  │
│ │  Commerce → Chantenay     38 min      │  │
│ │  ┌─────────┐┌─────────┐┌─────────┐   │  │
│ │  │🌿 2.1kg ││⚡ Rapide ││★ 87/100 │   │  │
│ │  └─────────┘└─────────┘└─────────┘   │  │
│ │  ───────────────────────────────────  │  │
│ │  {M4 — Segment marche, 4 min}         │  │
│ │  {M4 — Segment tramway 3, 22 min}     │  │
│ │  {M4 — Segment marche, 12 min}        │  │
│ │                                       │  │
│ │  ┌─────────────────────────────────┐  │  │
│ │  │  Partir maintenant  ──────────► │  │  │
│ │  └─────────────────────────────────┘  │  │
│ └───────────────────────────────────────┘  │
│ [🗺 Carte] [🔍 Trajets] [📊 Stats] [👤 Moi] │
└─────────────────────────────────────────────┘
```

**Specs :**
- Header du panel sticky, avec `←` retour (pas de back browser)
- Chips CO2/Score/Rapidité : 3 chips horizontaux scrollables si overflow
- Tap sur un segment M4 → caméra carte zoom sur ce segment + segment mis en valeur
- CTA "Partir maintenant" sticky en bas du panel, séparé par border-top
- Animation du panel : expand depuis la carte M3 cliquée (shared element)

---

### Écran 8 — Modale consentement tracking GPS

```
┌─────────────────────────────────────────────┐
│░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│ ◄ carte + scrim
│░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
│                                             │
│         ╔═════════════════════════╗         │
│         ║                         ║         │
│         ║  (icône navigation SVG  ║         │
│         ║   avec effet pulse)     ║         │
│         ║                         ║         │
│         ║  Suivi de trajet actif  ║         │
│         ║                         ║         │
│         ║  Pour valider votre     ║         │
│         ║  trajet et gagner des   ║         │
│         ║  points, UrbanFlow peut ║         │
│         ║  suivre votre position  ║         │
│         ║  jusqu'à destination.   ║         │
│         ║                         ║         │
│         ║  ✓  Arrêt auto à arrivée║         │
│         ║  ✓  +100% de points     ║         │
│         ║                         ║         │
│         ║  [ Activer le suivi → ] ║         │
│         ║  [ Partir sans suivi  ] ║         │
│         ╚═════════════════════════╝         │
│                                             │
└─────────────────────────────────────────────┘
```

**Specs :**
- Scrim : `--bg-overlay` (85%) + `backdrop-filter: blur(4px)`
- Panneau : `--bg-elevated`, `border-radius: --radius-xl`, elevation Level 4
- Animation entrée : scale `0.95 → 1` + fade-in, 300ms `--ease-out`
- CTA primaire : A1 (éco) + bonus points mis en évidence
- CTA secondaire : A2 (ghost)

---

### Écran 9 — Carte · Tracking actif

```
┌─────────────────────────────────────────────┐
│(safe-area top)                              │
│ ┌───────────────────────────────────────┐   │
│ │  🟢 Trajet en cours · 14 min restants │   │ ◄ banner top
│ └───────────────────────────────────────┘   │
│                                             │
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   │
│ ░░░░░░░░░░░░░░ CARTE CENTRÉE ░░░░░░░░░░░   │ ◄ suit la position GPS
│ ░░░░░░░░░░░░░░ SUR GPS USER  ░░░░░░░░░░░   │
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   │
│           ◎ (marqueur pulsant vert)         │
│                                             │
│ ┌─ (handle) ────────────────────────────┐  │
│ │  Segment actuel                        │  │
│ │  🚋 Tramway 3 · Direction Orvault      │  │
│ │  Arrêt actuel : Commerce  →  Italique  │  │
│ │  Prochains : 14:39 · 14:46 · 14:53    │  │
│ │                                        │  │
│ │  ─────────────────────────────────    │  │
│ │  Progression globale                   │  │
│ │  ▓▓▓▓▓▓▓▓░░░░░░░░  62%  · 8 min rest. │  │
│ │                                        │  │
│ │  [ Terminer le trajet ]                │  │
│ └────────────────────────────────────────┘  │
│ [🗺 Carte] [🔍 Trajets] [📊 Stats] [👤 Moi] │
└─────────────────────────────────────────────┘
```

**Specs :**
- Banner top : background `rgba(74,222,128,0.15)`, border-bottom `--border-eco`, hauteur 44px
- Indicateur actif : point vert animé 8px + texte 14px 500 `--accent-eco`
- Marqueur GPS : double anneau pulsant vert (animation eco-pulse)
- Carte suit automatiquement la position (auto-pan toutes les 5s)
- Barre de progression : gradient `--accent-eco`, fond `--bg-card`
- Panel bas : hauteur fixe ~200px (ne cache pas trop la carte)
- "Terminer le trajet" : bouton A2 (ghost) — action irréversible = couleur neutre

---

### Écran 10 — Modale résumé de trajet

```
┌─────────────────────────────────────────────┐
│░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
│         ╔═════════════════════════╗         │
│         ║                         ║         │
│         ║   🏅 (confetti + glow)  ║         │
│         ║                         ║         │
│         ║   Trajet accompli !     ║         │
│         ║                         ║         │
│         ║  Commerce → Chantenay   ║         │
│         ║  Réel : 41 min          ║         │
│         ║                         ║         │
│         ║  ┌──────────┬─────────┐ ║         │
│         ║  │ +156 pts │ 2.4 kg  │ ║         │
│         ║  │  gagnés  │ CO₂ éco.│ ║         │
│         ║  └──────────┴─────────┘ ║         │
│         ║                         ║         │
│         ║  🏆  Badge débloqué !   ║         │
│         ║  [Badge A7 — animé]     ║         │
│         ║                         ║         │
│         ║  [ Voir mon tableau de bord ]     ║ │
│         ║  [ Terminer ]           ║         │
│         ╚═════════════════════════╝         │
└─────────────────────────────────────────────┘
```

**Specs :**
- Animation entrée : confetti SVG en fond (particles vertes/bleues), 2s
- Médaille : 64px, animation `badge-unlock` (bounce 400ms)
- Points : counter animé (count-up), vert, 32px display
- CO2 : 32px display, couleur `--accent-eco`
- Badge si nouveau : animation spéciale + border glow eco
- CTA "Tableau de bord" : A2, pas primaire (ne pas forcer la navigation)
- "Terminer" : A1, ferme et retourne à la carte vide

---

### Écran 11 — Dashboard (Stats & Gamification)

```
┌─────────────────────────────────────────────┐
│(safe-area top)                              │
│ ← (back)  Mes stats         juin 2026      │
│                                             │
│ ─────────────────────────────────────────── │
│                                             │
│  Ce mois                                    │
│  ┌────────────────┐  ┌────────────────┐     │
│  │ CO₂ économisé  │  │    Trajets     │     │
│  │  2.4 kg        │  │     12         │     │
│  │  ↑ +18%        │  │   +3 vs m-1   │     │
│  └────────────────┘  └────────────────┘     │
│  ┌────────────────┐                         │
│  │    Points      │                         │
│  │    1 240       │                         │
│  │  🥈 Rang Argent│                         │
│  └────────────────┘                         │
│                                             │
│  CO₂ économisé par semaine                  │
│  ┌─────────────────────────────────────┐    │
│  │ [Graphique barres Recharts]         │    │
│  │ S1  S2  S3  S4   (4 semaines)       │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  Modes utilisés ce mois                     │
│  ┌─────────────────────────────────────┐    │
│  │ [Donut Recharts · 5 modes max]      │    │
│  │ 🚋 Tram 45%  🚲 Vélo 30%  ...       │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  Mes badges  ──────────────────── Voir tout │
│  [O5 — grille badges 3 colonnes]            │
│                                             │
│ [🗺 Carte] [🔍 Trajets] [📊 Stats*] [👤 Moi]│ ◄ Stats actif
└─────────────────────────────────────────────┘
```

**Specs :**
- Fond : `--bg-base`
- Header sticky, hauteur 56px
- Mois sélectionnable (← ›) — navigation entre mois
- Grid stats : 2 colonnes + 1 pleine largeur en dessous
- Graphiques : fond `--bg-elevated`, `border-radius: --radius-lg`, padding 16px
- Axes recharts : `--text-muted`, grid lines `--border`
- "Voir tout" pour les badges : link text `--accent-transit`
- Skeleton loaders sur chaque section pendant le chargement

---

### Écran 12 — Profil & Préférences de mobilité

```
┌─────────────────────────────────────────────┐
│(safe-area top)                              │
│ ← (back)   Mon profil                       │
│                                             │
│  ┌──────────────────────────────────────┐   │
│  │  ◉ (avatar 48px)  Elwen C.           │   │
│  │  coussotelwen@gmail.com              │   │
│  │                           [ Modifier]│   │
│  └──────────────────────────────────────┘   │
│                                             │
│  Préférences de trajet                      │
│  ─────────────────────────────────────────  │
│                                             │
│  Modes de transport                         │
│  ┌──────────────────────────────────────┐   │
│  │ 🚶 Marche    ●──────────────────● ON │   │
│  │ 🚋 Tramway   ●──────────────────● ON │   │
│  │ 🚌 Bus       ●──────────────────● ON │   │
│  │ 🚲 Vélo      ●──────────────────● OFF│   │
│  │ 🛴 Trottinette ●────────────────● OFF│   │
│  │ ⛴  Navibus   ●──────────────────● ON │   │
│  │ 🚆 Train     ●──────────────────● ON │   │
│  └──────────────────────────────────────┘   │
│                                             │
│  Priorité itinéraire                        │
│  ┌──────────────────────────────────────┐   │
│  │ [ Équilibré ]  [ Rapide ]  [ Éco ] ← actif│
│  └──────────────────────────────────────┘   │
│                                             │
│  Marche maximum                             │
│  ──────●──────── 15 min ────────────────    │
│                                             │
│  ♿ Accessibilité PMR                        │
│  [Toggle A8]  Activer le mode PMR           │
│                                             │
│  [ Sauvegarder ]                            │
│                                             │
│ [🗺 Carte] [🔍 Trajets] [📊 Stats] [👤 Moi*]│
└─────────────────────────────────────────────┘
```

**Specs :**
- Section toggle modes : icône SVG 20px + label 15px + toggle A8
- Sélection priorité : 3 pills segmentées, actif = `--accent-eco` fond + `--bg-deep` texte
- Slider marche max : accent `--accent-eco`, fond track `--bg-card`, thumb 20px
- Toggle PMR : section mise en évidence avec badge "Accessibilité"
- Bouton sauvegarder : A1 sticky en bas, visible quand un changement est détecté

---

### Écran 13 — Paramètres

```
┌─────────────────────────────────────────────┐
│ ← (back)   Paramètres                       │
│                                             │
│  Compte                                     │
│  ─────────────────────────────────────────  │
│  › Modifier mes informations                │
│  › Changer mon mot de passe                 │
│  › Gérer mes données (RGPD)                 │
│                                             │
│  Application                                │
│  ─────────────────────────────────────────  │
│  Thème              [ Sombre ▼ ]            │
│  Langue             [ Français ▼ ]          │
│  Notifications push [Toggle ON]             │
│                                             │
│  Confidentialité                            │
│  ─────────────────────────────────────────  │
│  Géolocalisation  [Toggle ON]               │
│  Historique trajets [Toggle ON]             │
│  › Politique de confidentialité             │
│                                             │
│  Informations                               │
│  ─────────────────────────────────────────  │
│  › À propos d'UrbanFlow                     │
│  › Version 1.0.0                            │
│  › Crédits données (ADEME, Naolib...)       │
│                                             │
│  [ Se déconnecter ]          (rouge, ghost) │
│  [ Supprimer mon compte ]    (rouge, ghost) │
│                                             │
│ [🗺 Carte] [🔍 Trajets] [📊 Stats] [👤 Moi*]│
└─────────────────────────────────────────────┘
```

**Specs :**
- Items de liste : hauteur 52px, chevron `--text-muted` 16px
- Destructive actions : `--error` text, séparées visuellement (margin-top 32px)
- Confirmation required : dialog avant déconnexion et suppression

---

## 6. États de composants

### Bouton — Matrice d'états

| État | Background | Texte | Ombre | Transform |
|------|-----------|-------|-------|-----------|
| Default | `--accent-eco` | `#060C08` | glow eco | none |
| Hover | `--accent-eco` + 10% bright | `#060C08` | glow eco ×1.2 | none |
| Pressed | `--accent-eco` - 10% | `#060C08` | glow eco ×0.6 | scale(0.97) |
| Disabled | `--accent-eco` 35% opacité | `#060C08` 35% | aucune | none |
| Loading | `--accent-eco` | — | glow eco | none + spinner |

### Input — Matrice d'états

| État | Bordure | Shadow | Couleur texte |
|------|---------|--------|---------------|
| Default | `--border` | aucune | `--text-primary` |
| Focus | `--accent-eco` | `0 0 0 3px rgba(74,222,128,0.2)` | `--text-primary` |
| Filled | `--border-strong` | aucune | `--text-primary` |
| Error | `--error` | `0 0 0 3px rgba(239,68,68,0.2)` | `--text-primary` |
| Disabled | `--border` 50% | aucune | `--text-disabled` |

### Toast — Types

| Type | Border-left | Icône |
|------|-------------|-------|
| Success (points) | `--accent-eco` | check-circle vert |
| Warning (météo) | `--warning` | alert-triangle amber |
| Error | `--error` | x-circle rouge |
| Info | `--accent-transit` | info bleu |

---

## 7. Règles carte Leaflet (thème sombre)

### Tuiles
```
URL dark matter : https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png
Attribution : © OpenStreetMap contributors © CARTO
```

### Marqueur utilisateur
```
Cercle central : 12px, --accent-eco (rempli)
Anneau 1 : 24px, --accent-eco 40% opacité
Anneau 2 : 40px, --accent-eco 15% opacité, animation pulse 2s
```

### Tracé d'itinéraire
```
Segments : strokeColor = --mode-*, strokeWeight = 4px, strokeOpacity = 0.9
Segment actif (sélectionné dans panel) : strokeWeight = 6px, halo blanc 1px
Segments autres itinéraires : strokeOpacity = 0.25
```

### Marqueurs stations Bicloo
```
Icône : SVG vélo 20×20px, fond --mode-bike, border-radius full
Disponible : fond --mode-bike
Vide : fond --text-muted
Plein : fond --warning
```

### Popups carte
```
Background : --bg-elevated
Border : 1px solid --border
Border-radius : --radius-md
Font : Inter 13px
Text : --text-primary
```

---

## 8. Responsive (desktop ≥ 1024px)

Sur desktop, la structure change :
- La bottom navigation devient une **sidebar gauche** (240px)
- Le panel résultats (O3) devient une **sidebar droite** (360px)
- La carte occupe le centre
- L'en-tête disparaît (le logo passe dans la sidebar)

```
┌─────────┬──────────────────────────────────┬────────────┐
│         │                                  │            │
│ SIDEBAR │         CARTE (100%)             │  RÉSULTATS │
│ GAUCHE  │                                  │  (slide-in)│
│  240px  │                                  │   360px    │
│         │                                  │            │
│ 🗺 Carte│                                  │  [Journey  │
│         │                                  │   cards]   │
│ 🔍Trajet│                                  │            │
│         │                                  │            │
│ 📊 Stats│                                  │            │
│         │                                  │            │
│ 👤 Profil│                                 │            │
│         │                                  │            │
└─────────┴──────────────────────────────────┴────────────┘
```

---

## 9. Animations & micro-interactions — Catalogue

### Transition de navigation (bottom nav)

```
Page sortante : opacity 1→0, translateY 0→8px, 150ms ease-in
Page entrante : opacity 0→1, translateY 12px→0, 200ms ease-out
Délai entre : 0ms (crossfade simultané)
```

### Bottom sheet — Ouverture

```
Initial  : translateY(100%)
Final    : translateY(0)
Duration : 300ms
Easing   : cubic-bezier(0.16, 1, 0.3, 1) — overshoot très léger
```

### Bottom sheet — Fermeture

```
Initial  : translateY(0)
Final    : translateY(100%)
Duration : 200ms
Easing   : cubic-bezier(0.4, 0, 1, 1) — ease-in
```

### Badge unlock

```
0%   : scale(0.85) opacity(0)
40%  : scale(1.08) opacity(1)
70%  : scale(0.97)
100% : scale(1)
+ glow eco pulse 2 cycles
Duration : 600ms, easing: ease-out
```

### Points count-up

```
Durée : 800ms
Easing : ease-out (commence vite, finit lentement)
Implémentation : requestAnimationFrame loop
```

### Marqueur GPS pulse

```
@keyframes eco-pulse {
  0%   { transform: scale(1); opacity: 1; }
  70%  { transform: scale(2.2); opacity: 0; }
  100% { transform: scale(2.2); opacity: 0; }
}
Duration: 2s, infinite, ease-out
Appliquer aux anneaux 1 et 2, délai décalé +0.4s pour anneau 2
```

### Bouton press

```
onPointerDown : scale(0.97), 120ms ease-out
onPointerUp   : scale(1), 200ms cubic-bezier(0.34, 1.56, 0.64, 1)
(légère surtension sur le retour = feeling premium)
```

### Skeleton shimmer

```
background: linear-gradient(
  90deg,
  --bg-card 0%,
  rgba(255,255,255,0.06) 40%,
  rgba(255,255,255,0.06) 60%,
  --bg-card 100%
)
background-size: 300% 100%
animation: shimmer 1.5s linear infinite
@keyframes shimmer { 0% {bgPos: -100%} 100% {bgPos: 200%} }
```

---

## 10. Plan de réalisation Figma — Étapes

### Phase 1 — Fondations (Figma Styles & Variables)

**Durée estimée : 2-3h**

1. Créer un fichier Figma vierge nommé "UrbanFlow 2.0 — Design System"
2. **Couleurs** : créer toutes les Color Variables (Figma Variables panel)
   - Collection "Global" : toutes les valeurs hex brutes
   - Collection "Semantic" : les tokens qui pointent vers Global
3. **Typographie** : créer les Text Styles (Display, H1→H3, Body-LG, Body, Body-SM, Caption, Mono)
4. **Effects** : créer les Effect Styles (Level 0→4, Glow Eco, Glow Transit)
5. **Grid** : créer les Layout Grids (Mobile 375px : 16px margin · 4 cols · 8px gap)

---

### Phase 2 — Atomes (Components)

**Durée estimée : 3-4h**

Pour chaque atome, créer un **Component** Figma avec toutes les variantes via **Component Properties** :

1. **Button** : Primary / Secondary / Icon
   - Props : `variant` (primary | secondary | icon), `state` (default | hover | pressed | disabled | loading), `size` (sm | md | lg), `icon` (boolean)
2. **Input** : Text / Search
   - Props : `state` (default | focus | filled | error | disabled), `icon-left` (boolean), `icon-right` (boolean)
3. **Badge Mode** : une variante par mode de transport (7 variantes)
4. **Badge Éco** : CO2 display
5. **Badge Gamification** : locked / unlocked + icône swappable
6. **Toggle Switch** : on / off
7. **Spinner** : inline / page
8. **Skeleton** : text / card / chart

---

### Phase 3 — Molécules (Components complexes)

**Durée estimée : 4-5h**

1. **Search Bar** : état collapsed (barre simple) + expanded (2 champs)
2. **Datetime Picker** : pill compacte
3. **Journey Card** (M3) : variantes recommended / standard / selected
4. **Segment Detail** (M4) : variantes par mode
5. **Stat Card** (M5) : variantes par type (CO2 / trajets / points)
6. **Nav Item** (M6) : variantes actif / inactif pour les 4 destinations
7. **Weather Badge** (M7) : variantes par condition météo
8. **Toast** (M8) : variantes success / warning / error / info

---

### Phase 4 — Organismes

**Durée estimée : 3-4h**

1. **Bottom Navigation** : assembler 4× Nav Item, état "actif" sur chaque variante
2. **Top Bar (carte)** : logo + 3 boutons contrôle couches
3. **Bottom Sheet** : frame vide avec handle + padding + scroll area
4. **Journey Results Panel** : O3 assemblé avec 3× Journey Card
5. **Journey Detail Panel** : O4 assemblé avec segments
6. **Badge Grid** : O5 en grille 3 col
7. **Stats Section** : O6 assemblé

---

### Phase 5 — Écrans mobile (375×812px)

**Ordre recommandé :**

1. Splash Screen
2. Consentement géolocalisation
3. Login
4. Register
5. Carte — Vide
6. Carte — Search active
7. Carte — Résultats
8. Carte — Détail itinéraire
9. Carte — Tracking actif
10. Modale tracking consent
11. Modale résumé trajet
12. Dashboard
13. Profil & Préférences
14. Paramètres

**Pour chaque écran :**
- Frame iPhone 14 (390×844) comme base → ajuster à 375px
- Safe areas : status bar 44px top, home indicator 34px bottom
- Utiliser les components des phases 2-4
- Appliquer les Color Variables
- Annoter les interactions avec des flèches de prototypage

---

### Phase 6 — Prototype interactif

**Durée estimée : 2h**

Connecter les écrans dans Figma Prototyping :
1. Login → Carte Vide
2. Carte Vide (tap search bar) → Carte Search
3. Carte Search (tap suggestion) → Carte Résultats (via loading state)
4. Carte Résultats (tap carte) → Carte Détail
5. Carte Détail (tap "Partir") → Modale Tracking Consent
6. Modale Consent (accepter) → Carte Tracking
7. Carte Tracking (arriver) → Modale Résumé
8. Bottom nav (tap Stats) → Dashboard
9. Bottom nav (tap Profil) → Profil

Transitions recommandées :
- Bottom sheets : "Move in" + direction "Bottom"
- Navigation pages : "Dissolve" ou "Push Left"
- Modales : "Dissolve" + scale depuis le centre

---

### Phase 7 — Écran desktop (1440px) *(optionnel)*

Adapter les 5 écrans principaux en version desktop avec layout sidebar.

---

## 11. Assets à préparer avant Figma

### Icônes SVG nécessaires (Lucide Icons)
```
navigation-2, map-pin, search, x, chevron-right, chevron-left,
arrow-right, arrow-left, arrow-up, arrow-down,
leaf, bike, train, bus, ship, footprints, zap,
trophy, award, star, medal,
chart-bar, pie-chart,
user, settings, bell, log-out, trash-2,
cloud, cloud-rain, sun, cloud-snow, wind,
check-circle, x-circle, alert-triangle, info,
eye, eye-off, lock, mail,
toggle-left, toggle-right,
layers, map, compass
```

### Logo UrbanFlow
Créer un logo SVG : feuille stylisée fusionnée avec une route/tracé GPS.
Couleur : `--accent-eco` (#4ADE80).
Export : SVG + PNG 2× (64px, 128px, 256px pour PWA manifest).

### Favicon & PWA Icons
- 192×192px PNG
- 512×512px PNG
- maskable icon avec fond `--bg-deep` + logo 60% viewport

---

## 12. Éco-conception — Règles pour l'implémentation

### Animations

| Animation | Statut | Recommandation |
|-----------|--------|----------------|
| `eco-pulse` (GPS marker) | ⚠ Infinie | Arrêter après 10s d'inactivité via `IntersectionObserver` + `animation-play-state` |
| `shimmer` (skeleton) | ✅ Transitoire | S'arrête quand les données arrivent |
| `badge-unlock` | ✅ `forwards` | Une seule fois |
| `slide-up` (bottom sheet) | ✅ `forwards` | Une seule fois |
| `backdrop-filter: blur()` | ⚠ GPU-intensif | Via `@supports`, fallback opaque si non supporté |

**Règle `prefers-reduced-motion`** : le bloc CSS global dans `DESIGN-SYSTEM.md` coupe toutes les animations à `0.01ms`. Exception maintenue : les spinners de chargement (état fonctionnel).

### Chargement des ressources

| Ressource | Optimisation requise |
|-----------|---------------------|
| Police Inter | Charger uniquement weights utilisés : `400, 500, 600, 700` (pas 300 ni 800) |
| Tuiles carte | `loading="lazy"` sur l'initialisation hors viewport — déjà géré par Leaflet |
| SVG Lucide | Tree-shaking : importer uniquement les icônes utilisées (pas `lucide-react` entier) |
| Composants Recharts | `React.lazy` + `Suspense` (déjà en place dans DashboardPage) |
| Couches carte (Bicloo, TAN) | `React.lazy` + `Suspense` (déjà en place dans MapPage) |

### Limites d'usage backdrop-filter

Limiter `backdrop-filter: blur()` à **2 couches simultanées maximum** au même moment :
- ✅ Bottom nav (permanent) + Bottom sheet (quand ouverte) = 2 couches
- ❌ Bottom nav + Bottom sheet + Modale + Toast = 4 couches simultanées → jank garanti

---

## 13. Checklist avant export vers dev

**Thèmes — double mode**
- [ ] Tous les écrans existent en variante Dark ET Light dans Figma (2 frames par écran)
- [ ] Variables Figma : 2 collections — "Dark / Urban Night" et "Light / Urban Day"
- [ ] Vérifier que chaque frame light utilise bien les couleurs de la collection Light
- [ ] Tuile carte : Dark Matter pour dark, Positron pour light (simuler via un rectangle de fond)

**Couleurs & Contrastes (WCAG 1.4.3)**
- [ ] Toutes les Color Variables utilisées (aucun hex hardcodé dans les composants)
- [ ] `--error` / `--info` utilisés uniquement pour bordures/icônes, pas comme texte normal
- [ ] `--error-text` (`#F87171`) et `--info-text` (`#93C5FD`) utilisés pour tous les messages texte
- [ ] `--text-disabled` (`#4D6B55`) utilisé uniquement sur éléments `disabled` (exempt WCAG)

**Typographie**
- [ ] Toutes les Text Styles appliquées (aucun style personnalisé isolé)
- [ ] Taille minimale 16px pour les inputs (évite zoom iOS)
- [ ] Taille minimale 11px pour les captions (pas en dessous)

**Structure & Composants**
- [ ] Tous les composants nommés en kebab-case (`button-primary`, `journey-card`)
- [ ] Les variantes organisées en Component Sets avec Properties propres
- [ ] Les frames d'écrans en auto-layout vertical
- [ ] Safe areas représentées sur tous les écrans mobile (44px top, 34px bottom)

**Accessibilité (WCAG 2.1 AA)**
- [ ] Pas d'emojis comme icônes — SVG uniquement (WCAG 1.4.1)
- [ ] États interactifs présents : default, hover, pressed, **focus**, disabled sur tous les atomes
- [ ] Anneau `:focus-visible` visible sur TOUS les éléments interactifs (min 3px, couleur `--accent-eco`)
- [ ] Annotations Figma : `aria-label` sur chaque bouton icône (🚲, 🚌, ⊕...)
- [ ] Annotations Figma : `role="navigation" aria-label="Navigation principale"` sur bottom nav
- [ ] Annotations Figma : `role="dialog" aria-modal="true"` sur modales et bottom sheets
- [ ] Annotations Figma : `role="status" aria-live="polite"` sur les toasts
- [ ] Annotations Figma : `role="application" aria-label="Carte de mobilité de Nantes"` sur la carte
- [ ] Chips de mode : icône SVG TOUJOURS présente (pas couleur seule)

**Éco-conception**
- [ ] `prefers-reduced-motion` : bloc CSS global en place dans DESIGN-SYSTEM.md ✅
- [ ] `backdrop-filter` via `@supports` avec fallback opaque ✅
- [ ] Polices Inter : uniquement weights 400, 500, 600, 700 chargés
- [ ] SVG Lucide : tree-shaking (imports individuels)
- [ ] `eco-pulse` infini → TODO implémentation : `IntersectionObserver` pour pause hors viewport

**Prototype**
- [ ] Prototype flow complet testé du Login au résumé de trajet
- [ ] Annotations (comments Figma) sur les comportements non évidents

---

*Guide généré le 02/06/2026 — UrbanFlow SmartRoute · Projet Titre 6 CDSD*