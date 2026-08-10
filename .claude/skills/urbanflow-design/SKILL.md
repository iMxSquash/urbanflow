---
name: urbanflow-design
description: >
  Design system UrbanFlow SmartRoute — direction "Estuaire". Auto-invoqué quand
  Claude Code crée ou modifie des composants React, des pages ou des éléments UI.
  Encode les tokens, conventions et règles visuelles du projet.
---

# Design System — UrbanFlow SmartRoute (direction "Estuaire")

Tu es le garant du design system UrbanFlow. Chaque composant React que tu crées
ou modifies doit respecter ces règles sans exception.

Source de vérité : [`docs/design/DESIGN-SYSTEM.md`](../../../docs/design/DESIGN-SYSTEM.md)
(tokens CSS) et [`docs/design/MAQUETTE.md`](../../../docs/design/MAQUETTE.md) (specs
d'écran), synchronisés depuis le projet Claude Design "Urbanflow design directions".
**En cas de divergence entre ces docs et `src/client/index.css`, `index.css` fait foi**
— plusieurs corrections de contraste et de bug ont été appliquées directement en code
après la rédaction des docs (ex. `--color-text-subtle` et `--color-on-primary-muted` en
sombre). Ce fichier reflète l'état réel du code.

**Aucun outil de vérification visuelle n'est disponible dans cet environnement**
(pas de navigateur, pas d'Axe DevTools, pas de Chrome DevTools MCP) : vérifier via
`tsc --noEmit`, `eslint`, `vitest run`, `vite build`, et signaler explicitement toute
vérification visuelle, clavier ou responsive qui n'a pas pu être faite plutôt que
d'affirmer un résultat non contrôlé. S'applique à toute la checklist accessibilité et
responsive plus bas.

---

## Identité visuelle — "Estuaire"

> « Une base papier chaude, un accent vert estuaire sourd, un bleu Loire pour le temps
> réel. Le calme d'Apple Plans avec une identité de service métropolitain — la carte
> reste le sujet, l'UI se retire. »

Remplace l'ancienne direction "Urban Night". Différences structurantes :
- **Le mode clair est le défaut** (sable et vert profond), le sombre est une surcharge
  `[data-theme="dark"]` sur `<html>` (posée par `useThemeSync`, store `theme.store.ts`).
- **Police Instrument Sans** (400/500/600/700), remplace Inter.
- **Pas de glassmorphism / `backdrop-filter`** — 4 niveaux d'ombre plats seulement
  (`shadow-card`, `shadow-card-md`, `shadow-sheet`, `shadow-modal`). C'était autorisé sous
  "Urban Night", c'est interdit sous Estuaire (ex. `WeatherBadge` corrigé en ce sens).

Cinq principes directeurs, non négociables :
1. **La carte reste le sujet** — tout le flux carte/recherche/itinéraire tient dans un
   bottom sheet unique à 8 états (`MapSheet`, voir plus bas) ; aucun réglage n'ouvre un
   écran séparé. Pas de top app-bar dupliquant la nav (supprimée à l'étape 3).
2. **Rien n'est porté par la seule couleur** (WCAG 1.4.1) — chaque mode de transport
   garde son icône propre, la marche est toujours en trait pointillé sur la carte.
3. **Aucune animation décorative en boucle** — pas de pulsation continue (ex. anneau GPS
   qui pulse en permanence), pas de parallaxe. Seuls `transform`/`opacity` s'animent en
   décoratif ; `top`/`bottom`/`max-height` du bottom sheet sont une exception documentée
   (transition de position, pas décoration — voir « Bottom sheet » plus bas).
4. **Divulgation progressive** — réglages avancés repliés par défaut sur mobile
   (`settings` state), toujours visibles sur le panneau desktop (pas de divulgation
   progressive là où l'espace le permet).
5. **RGPD à poids visuel égal** — sur un choix sensible (géolocalisation, suppression de
   compte), les deux options ont le même poids visuel, aucune n'est présélectionnée.

---

## Tokens couleurs

Toutes les couleurs sont des CSS custom properties dans `@theme` (`src/client/index.css`).
Tailwind v4 génère automatiquement les classes utilitaires à partir de `--color-*` —
`bg-primary`, `text-primary`, `border-primary`, `bg-surface`, `text-text-muted`, etc.
sont **déjà disponibles nativement**, pas besoin d'`@utility` custom pour elles.
**Ne jamais écrire de valeur hex en dur** dans une classe (`text-[#0B5C43]` interdit).

### Surfaces & texte

| Usage | Classe |
|-------|--------|
| Fond de page | `bg-bg` |
| Surface (cartes, panels, inputs) | `bg-surface` |
| Surface secondaire | `bg-surface-muted` |
| Zone creusée / skeleton | `bg-surface-sunken` |
| Bordure standard / active | `border-border` / `border-border-strong` |
| Texte principal | `text-text` (14,9:1 clair / 16,6:1 sombre) |
| Texte atténué | `text-text-muted` |
| Texte discret (captions, placeholders) | `text-text-subtle` |
| Texte désactivé | `text-text-disabled` |

### Vert primaire — action + gain écologique, **jamais utilisé ailleurs**

`bg-primary` / `text-primary` / `border-primary`, hover `bg-primary-hover`, fond teinté
`bg-primary-surface`, texte sur fond primary `text-on-primary`, texte secondaire sur fond
primary `text-on-primary-muted` (ex. sous-titre sur un bandeau vert, tuile KPI foncée).
Le vélo partage volontairement cette teinte (`--color-mode-bike` = `--color-primary`) —
c'est le mode que le produit pousse.

### Bleu transit — identifie le TC, **jamais une action**

`text-transit` / `bg-transit-surface`.

### Alerte & danger

- `warning` (`text-warning`, `bg-warning-surface`, `border-warning-border`,
  `text-on-warning`) : état inhabituel — mode démo, trajet écarté par un filtre, hors
  ligne, récompense expirée. **Toujours** icône + libellé, jamais la couleur seule.
- `danger` (`text-danger-text`, `bg-danger-surface`) : réservé à la suppression de compte,
  plus une exception nommée — **erreur bloquante** : une erreur qui empêche totalement de
  continuer l'action en cours (ex. `ErrorBanner` sur une erreur réseau qui bloque l'écran).
  Toute autre erreur de formulaire générique (validation, champ invalide) reste sur
  `warning`, jamais `danger`.

### Couleurs par mode de transport

Variable CSS directe (posée en style inline via `--mode-color`/`--mode-surface`, jamais
une classe statique — voir `ModeChip` plus bas) :

| Mode | Variable couleur | Variable surface |
|------|------------------|-------------------|
| Marche | `--color-mode-walk` | `--color-mode-walk-surface` |
| Vélo/Bicloo | `--color-mode-bike` (= `--color-primary`) | `--color-mode-bike-surface` |
| Trottinette | `--color-mode-scooter` | `--color-mode-scooter-surface` |
| Tramway | `--color-mode-tram` (= `--color-transit`) | `--color-mode-tram-surface` |
| Bus | `--color-mode-bus` | `--color-mode-bus-surface` |
| Navibus | `--color-mode-navibus` | `--color-mode-navibus-surface` |
| Train | `--color-mode-train` | `--color-mode-train-surface` |
| Voiture (référence, jamais sélectionnable) | `--color-mode-car` (hachures) | — |

Les 7 teintes sont vérifiées distinguables en deutéranopie/protanopie, mais l'icône
(`constants/mode-icons.tsx`) reste toujours le vecteur d'information principal — jamais
la couleur seule. La marche est toujours en trait pointillé sur la carte (`.trace-walk`),
tout tracé porte un halo `.trace-segment` de 2px pour la lisibilité sur les tuiles.

---

## Composants — Classes CSS custom (`@layer components`)

Ces classes vivent dans `index.css`. Les utiliser directement, ne pas recréer leur style.

### Bouton primaire — une seule instance par écran

```tsx
<button className="btn-primary">Rechercher un itinéraire</button>
```

### Bouton secondaire / ghost / eco

```tsx
<button className="btn-secondary">Annuler</button>
<button className="btn-ghost">Action tertiaire</button>
<button className="btn-eco">Action liée au gain écologique</button>
```

### Bouton icône — préférer le composant `IconButton`

```tsx
import { IconButton } from '../components/IconButton'

<IconButton icon={<XMarkIcon className="w-5 h-5" />} aria-label="Fermer le panneau" />
```

`aria-label` est un prop **requis** par le type (`ButtonHTMLAttributes` étendu) — un
oubli est une erreur TypeScript, pas seulement une violation a11y silencieuse.

### Carte

```tsx
<div className="card p-4">{/* contenu */}</div>
<div className="card-hover p-4">{/* élévation au survol */}</div>
<div className="card p-4 card-mode-accent" style={{ '--mode-color': 'var(--color-mode-bike)' }}>
  {/* liseré gauche 4px coloré par mode */}
</div>
```

### Chip de mode — préférer le composant `ModeChip`

```tsx
import { ModeChip } from '../components/ModeChip'

<ModeChip mode="bike" selected={selectedModes.includes('bike')} onClick={() => toggle('bike')} />
<ModeChip mode="tramway" size="sm" />  {/* variante compacte, sheet mi-hauteur */}
```

Sans `onClick`, `ModeChip` rend un `<span>` non interactif (résumé de trajet). Avec
`onClick`, un `<button aria-pressed>` (`data-selected`/`aria-pressed`, jamais
`aria-selected` sur un bouton — rôle non défini pour cet attribut, bug corrigé étape 3).

### Input de formulaire

```tsx
<div>
  <label htmlFor="origin" className="label">Point de départ</label>
  <input id="origin" type="text" className="input w-full" placeholder="Adresse ou lieu…" />
</div>
```

JAMAIS un input sans `<label>` associé (ou `aria-label`) — violation WCAG directe.

### Toggle — préférer le composant `Toggle` (checkbox natif, pas un `<button role="switch">`)

```tsx
import { Toggle } from '../components/Toggle'

<Toggle checked={pmr} onChange={setPmr} label="Trajet accessible (PMR)" description="Marche ≤ 5 min" />
```

Un `<button role="switch">` maison se ferait écraser par les tailles de contrôle globales
— voir « Pièges connus » plus bas. `Toggle` contourne ça avec un checkbox natif masqué
(`sr-only peer`) + un indicateur visuel 46×28px, poignée 22×22.

### Slider — préférer le composant `Slider` (`.slider`)

Piste 6px + poignée 26px à liseré `primary` ; un `accent-color` seul sur un
`<input type="range">` nu ne peut pas produire ce visuel — pseudo-éléments
`::-webkit-slider-thumb`/`::-moz-range-thumb` natifs dans `.slider` (`index.css`).

### Skeleton (chargement)

```tsx
<div className="skeleton h-4 w-3/4" />
```

Exempté de `prefers-reduced-motion` : le shimmer est une information d'état, pas une
décoration.

### Toast / notification

```tsx
<div role="status" aria-live="polite" aria-atomic="true">
  <div className="toast">Message de feedback</div>
</div>
```

### Bottom sheet — voir `MapSheet.tsx`, ne pas recréer un bottom sheet ad hoc

`.bottom-sheet` implémente 8 états nommés (`data-sheet-state`), une minimisation manuelle
(`data-mobile-minimized`) et un rail réductible desktop (`data-desktop-collapsed`). Sur
mobile c'est un `role="dialog"` **non modal** (focus rendu au déclencheur à la fermeture,
Échap replie d'un cran) sauf l'état 8 (fin de trajet), qui est une vraie modale
(`JourneySummaryModal`, `aria-modal="true"`). `top`/`bottom`/`max-height` s'y animent
délibérément (transition de position entre états, pas une décoration) — sauf `collapsed`
et `mid`, qui restent en hauteur intrinsèque (`h-auto`/`max-height`) parce qu'une valeur
`auto` ne s'interpole pas en CSS ; leur apparition passe par `animate-sheet-grow`
(`transform: scaleY`) à la place. ≥1024px, `.bottom-sheet` devient le panneau latéral
fixe (`lg:static lg:w-100 lg:min-w-[380px]`, `role="aside"`, tout visible sans
divulgation progressive).

### Modale — préférer le composant `Modal` (+ `useFocusTrap`)

```tsx
import { Modal } from '../components/Modal'

<Modal titleId="delete-account-title" onClose={close}>
  <h2 id="delete-account-title" className="text-h2 font-semibold text-text">Titre</h2>
</Modal>
```

Backdrop `var(--scrim)`, `role="dialog" aria-modal="true"`, ancrée bas sur mobile /
centrée `lg:` (`.modal`, `lg:w-140`), focus trap déjà câblé via `useFocusTrap`.

### Bottom nav (mobile) / sidebar (desktop) — préférer le composant `BottomNav`

`<nav aria-label="Navigation principale">`, 4 items mobiles + 1 (Paramètres,
`max-lg:hidden lg:mt-auto`) et un bloc identité (`UserFooter`, `hidden lg:flex`, avatar =
initiales de l'email — le modèle `AuthUser` ne porte que `email`, ne pas inventer de nom).
Pages hors carte : envelopper le contenu dans `PageWithSidebar` plutôt que de recâbler
`BottomNav` soi-même.

### Carte Leaflet — teinte des tuiles

Fond CartoDB : `basemaps.cartocdn.com/light_all` (clair) / `dark_all` (sombre —
`CARTO_POSITRON_DARK` malgré son nom, c'est bien Dark Matter), choisi via `isDarkMode`
sur `<TileLayer key={...} url={...} className={...}>` (`MapPage.tsx`). Teinte 100% CSS
(`filter`), aucun style vectoriel custom chargé — coût réseau nul.

- **Clair** : `saturate-[.55] contrast-[1.02]` sur le `TileLayer`.
- **Sombre** : `saturate-[.5] brightness-[.92]` sur le `TileLayer`.
- **Survol** : calque `absolute inset-0 pointer-events-none` plein cadre, dernier enfant
  du `<main role="application">` (marqué `group`), plutôt qu'un ciblage tuile par tuile —
  les tuiles Leaflet sont des `<img>` (élément remplacé), `::after` n'y a aucun effet.
  Clair : `mix-blend-multiply bg-primary group-hover:opacity-10`. Sombre :
  `mix-blend-screen bg-primary-surface group-hover:opacity-30` (`bg-primary-surface`
  résout à `#0F3A2C` en thème sombre — pas de hex en dur).

Ces valeurs correspondent maintenant à DESIGN-SYSTEM.md/MAQUETTE.md §6 (elles en
divergeaient avant correction — cf. historique Git si besoin de contexte).

---

## Composants React réutilisables — ne pas dupliquer

| Composant | Rôle |
|-----------|------|
| `IconButton` | Bouton icône `.btn-icon`, `aria-label` obligatoire (typé). |
| `ModeChip` | Chip de mode de transport, couleur/surface par mode. |
| `Toggle` | Switch accessible 46×28px (checkbox natif). |
| `Slider` | Range input stylé `.slider`. |
| `Modal` | Dialogue modal générique + focus trap. |
| `useFocusTrap(ref, onClose)` | Hook partagé par `Modal` et tout panneau non modal ayant besoin d'un piège de focus (ex. `OfflinePanel`). |
| `BottomNav` | Nav mobile → sidebar desktop, avec bloc identité. |
| `PageWithSidebar` | Enveloppe standard des pages hors carte (`lg:flex lg:h-screen`, sidebar figée + colonne contenu qui scrolle seule). |
| `MapSheet` | Bottom sheet 8 états / panneau latéral desktop — toute la logique carte/recherche/itinéraire. |
| `AuthShell` | Gabarit partagé Login/Register — plein-bord + header vert sur mobile, 2 colonnes (panneau de marque / formulaire) dès `lg:`. |
| `AddressSearch` / `SearchField` + `AddressSuggestionsList` + `useAddressAutocomplete` | Autocomplete d'adresse : `AddressSearch` (popover flottant, desktop) et `SearchField` (en flux, sheet mobile) partagent le même hook et la même liste — ne pas dupliquer la logique combobox. |
| `Co2FactorsNote` | Citation ADEME partagée (Dashboard + panneau desktop carte). |
| `EmptyResultsPanel` | État "aucun résultat" avec assouplissements réels en un tap. |
| `OfflinePanel` / `useOnlineStatus` | Mode hors ligne, focus trap, masqué pendant un suivi actif. |
| `constants/mode-icons.tsx` (`MODE_ICON_PATH_BASE`, `MODE_LABELS`, `modeColorVar`/`modeColorVarAlpha`/`modeColorToken`/`modeRouteClassName`) | Seule source pour icônes, libellés et couleurs de mode — jamais d'emoji fonctionnel, jamais de copie locale de ces tables. Partagé par `ModeChip`, `ModeBreakdownTable`, `JourneyPanel`, `JourneyLayer`. |
| `constants/weather-icons.tsx` (`WEATHER_ICON_PATH_BASE`) | Icônes météo (`WeatherBadge`) — jamais d'emoji (☀️☁️🌧️❄️⛈️). |
| `BadgeUnlockIcon` | Icône badge/médaille — remplace l'emoji 🏅, partagée par `JourneySummaryModal` et `TripToast`. |
| `Spinner` | Indicateur de chargement inline (`.skeleton` façonné en cercle) — jamais `animate-spin`, interdit ci-dessous. |
| `utils/recent-searches.ts` / `utils/last-journey-cache.ts` | `localStorage`, mêmes conventions (dédup, plafond) — réutiliser plutôt que réinventer un cache local. |
| `utils/journey-segment-info.ts` | Dérivés d'un segment (vitesse, calories, CO2 économisé vs voiture, horaires estimés) — logique métier hors des composants d'affichage (`JourneyPanel`). |
| `useMediaQuery('(min-width: 1024px)')` | Bascule JS mobile/desktop quand le CSS seul ne suffit pas (ex. rendu conditionnel du panneau desktop dans `MapSheet`). |
| `EcoMapLayer` | Scope creep assumé (absent de MAQUETTE.md/DESIGN-SYSTEM.md, cf. `01-PERIMETRE-MVP.md`) — heatmap CO2 sur la carte, dégradé `--color-eco-600` → `--color-warning` → `--color-danger` (pas de couleurs Tailwind arbitraires). Conservé et documenté ici plutôt que retiré, branché à `MapPage`. |

Il n'existe **pas** de bibliothèque d'icônes externe (pas de Lucide/Heroicons en
dépendance) : le set Estuaire est dessiné à la main dans `mode-icons.tsx` et inline dans
les composants — `viewBox 0 0 24 24`, extrémités/jonctions arrondies (`round`
linecap/linejoin), épaisseur 1,75px (icônes 20-26px), 1,9-2px (15-18px), 2,2-2,6px
(12-13px), pastilles d'icône 30/34/40/46px (rayon pill ou 12px). Détail source :
`MAQUETTE.md` §1.7. Réutiliser un path existant avant d'en dessiner un nouveau.

---

## Règles typographiques

Police : **Instrument Sans uniquement** (`--font-sans`, via `@fontsource/instrument-sans`).

| Classe | Taille | Usage |
|--------|--------|-------|
| `text-display` | 36px | Chiffres clés dashboard (points, kg CO₂) |
| `text-h1` | 30px | Titres de page |
| `text-h2` | 24px | Titres de section |
| `text-h3` | 20px | Sous-titres, titres de carte |
| `text-body-lg` | 18px | Corps mis en avant |
| `text-body` | 16px | Corps standard, inputs (évite le zoom iOS) |
| `text-body-sm` | 14px | Méta, descriptions |
| `text-label` | 13px | Labels de champ, chips |
| `text-caption` | 12px | Jamais en dessous de cette taille |

Chiffres en `tabular-nums` (`tabular` utility) partout où une valeur peut changer
(compteurs, distances, stats).

```tsx
// ✅ Correct
<h1 className="text-h1 font-bold text-text">Mes itinéraires</h1>
<span className="text-caption text-text-subtle">CO₂ économisé</span>

// ❌ Interdit
<h1 className="text-2xl font-bold text-slate-900">   // valeurs Tailwind génériques
<p style={{ fontSize: '15px' }}>                      // valeur absolue CSS
```

---

## Espacement, rayons, tailles de contrôle

**Espacement** : grille 4px = échelle numérique Tailwind par défaut (`p-1`=4px …
`p-10`=40px). Aucun token custom : utiliser `p-*`/`gap-*`/`space-y-*` directement.

**Rayons** — namespace natif `--radius-*` (génère `rounded-xs/sm/md/lg/xl/2xl/full`) :

| Classe | Valeur | Usage |
|--------|--------|-------|
| `rounded-xs` | 6px | Checkboxes, mini pastilles de mode |
| `rounded-sm` | 8px | Badges de segment, pastilles numérotées |
| `rounded-md` | 12px | Inputs, boutons secondaires, boutons icône |
| `rounded-lg` | 14px | Boutons primaires, nav actif, bandeaux d'alerte |
| `rounded-xl` | 16px | Cartes de résultat/contenu |
| `rounded-2xl` | 24px | Bottom sheet (coins hauts), modales |
| `rounded-full` | — | Chips, toggles, avatars, poignée de sheet |

**Tailles de contrôle** — pas de namespace Tailwind dédié (variables CSS `--control-*` à
consommer via `height:var(--control-*)`, ou via la classe `h-*` équivalente puisque
l'échelle spacing Tailwind = 4px : `h-7`=28px, `h-9`=36px, `h-10`=40px, `h-11`=44px,
`h-12`=48px, `h-13`=52px) :

| Token | Hauteur | Usage |
|-------|---------|-------|
| `control-xs` | 28px | Badges/toggles non interactifs |
| `control-sm` | 36px | Chips de mode en sheet mi-hauteur |
| `control-md` | 40px | Chips de mode pleine taille, boutons icône desktop |
| `control-lg` | 44px | **Cible tactile minimum** (WCAG 2.5.5 — critère AAA, pas AA, mais retenu comme cible projet). Chips profil, boutons icône flottants carte |
| `control-xl` | 48px | Champs de saisie, lignes de réglage, boutons secondaires |
| `control-2xl` | 52px | Action principale de l'écran (une seule par vue) |

**Ne jamais imposer une taille de contrôle en dehors de cette échelle**, et surtout ne
jamais ajouter une règle globale `min-height:48px`/`min-width:48px` sur `button, a,
[role="button"]` — voir « Pièges connus ».

---

## Legacy compat

Ces alias existent uniquement pour les composants pas encore migrés vers les tokens
Estuaire actuels — **aucun composant neuf ne doit les utiliser**.

- **Rampes `eco-*` / `transit-*`** (`--color-eco-50..900`, `--color-transit-50..900`) :
  syntaxe Tailwind à paliers (`bg-eco-50`, `text-transit-700`...), dérivées des tokens
  Estuaire réels (paliers 600/50 exacts, le reste interpolé). Code neuf : utiliser
  directement les tokens sémantiques (`primary`, `transit`).
- **`radius-card` / `radius-button` / `shadow-float`** : équivalents `radius-card` =
  `radius-xl`, `radius-button` = `radius-md`, `shadow-float` = `shadow-modal`
  (dialogues flottants type consentement géoloc / résumé de trajet). Code neuf :
  préférer directement `rounded-xl`, `rounded-md`, `shadow-modal`.

`shadow-card-md` n'est **pas** concerné par cette liste : c'est le 4e niveau d'ombre actif
(`--shadow-card-md`, panneaux flottants / cartes mises en avant), utilisé notamment par
`.card-hover:hover`. À utiliser normalement dans du code neuf.

---

## Accessibilité (WCAG 2.1 AA) — Non-négociable

1. **Images** : `alt` descriptif, `alt=""` si décorative.
2. **Formulaires** : `<label htmlFor>` ou `aria-label` pour chaque input.
3. **Boutons icône** : `aria-label` — utiliser `IconButton`, qui le rend obligatoire au type.
4. **États dynamiques** : `role="status" aria-live="polite"` sur les zones de feedback
   (résultats d'autocomplete, confirmation de copie, toasts).
5. **Focus visible** : géré globalement (`:focus-visible { ring-2 ring-primary
   ring-offset-2 }`) — ne jamais poser `outline-none` sans compensation.
6. **Couleur** : jamais seule pour transmettre une info — icône + couleur, ou texte +
   couleur (mode de transport, alerte météo, bandeau ambré).
7. **Cible tactile** : `control-lg` (44px) minimum pour une action réelle. **La cible
   WCAG AA de ce projet n'exige pas 48px** — c'est un critère AAA, ne pas l'imposer en
   règle globale (cf. pièges connus).
8. **Carte Leaflet** : `role="application" aria-label="Carte de mobilité de Nantes"`.
9. **Bottom sheet** : `role="dialog"` non modal + focus rendu au déclencheur + Échap
   replie d'un cran (sauf état 8 = vraie modale).
10. **Toast** : `role="status" aria-live="polite" aria-atomic="true"`.
11. **Radiogroup / tabs** : roving tabindex + navigation flèches (pas seulement Tab) —
    tout nouveau groupe de type "profil Éco/Rapide/Équilibré" ou tabs doit le porter dès
    la création, ce fut un oubli corrigé après coup sur `RewardsPage`/`ParametresPage`.
12. **Autocomplete** : `role="combobox"` + `listbox`, debounce 300ms, `role="status"`
    annonçant le nombre de résultats. Les items "Récents" font partie du **même**
    `listbox` que les suggestions live (même navigation clavier ↑↓/Entrée/Échap) — ne
    jamais les rendre comme des `<div>`/`<button>` isolés hors du modèle combobox.
13. **Tableaux plutôt que graphiques image** : la répartition par mode est un `<table>`
    HTML natif (`ModeBreakdownTable`), pas un graphique SVG/canvas — "le tableau est le
    graphique" (a11y).
14. **`aria-current="page"`** sur l'item de nav actif (déjà géré par `BottomNav`/`NavLink`).

Vérification manuelle uniquement ici (labels, rôles, roving-tabindex, focus trap,
régions live) — voir la limite d'outillage en tête de fichier.

---

## Animations — Règles strictes

✅ Autorisé :
```tsx
className="animate-fade-in"       // opacity 0→1, 150ms
className="animate-slide-up"      // translateY(8px) + fade, 200ms (apparition modale)
className="animate-badge-unlock"  // scale + fade, 300ms — badges déverrouillés, une seule fois
className="animate-count-up"      // translateY(4px) + fade, 200ms (compteurs)
className="animate-sheet-grow"    // scaleY 0.92→1, 200ms — croissance collapsed/mid du sheet
className="transition-colors"     // hover/focus — durée via duration-fast/normal/slow
```

❌ Interdit :
- Toute animation en boucle visible en permanence (anneau qui pulse, indicateur "live" en
  boucle) — un suivi GPS actif se signale par un état statique ou une pulsation **unique**
  au changement d'état, jamais continue. Deux animations de ce type ont été retirées
  pendant la migration (anneau GPS, indicateur "Suivi GPS actif").
- `framer-motion`, scroll animations, parallaxe, GSAP ScrollTrigger.
- `animate-spin`, `animate-bounce`.
- Animer `height`/`box-shadow` — seuls `transform`/`opacity` animent en décoratif
  (`top`/`bottom`/`max-height`/`width` du bottom sheet sont l'exception documentée d'une
  transition de layout, pas d'une décoration).

`prefers-reduced-motion` est géré globalement dans `index.css` — `.skeleton` en est
explicitement exempté (le shimmer est une information d'état).

---

## Responsive — Mobile-first, breakpoint `lg` = 1024px

Pas de breakpoint custom pour ce seuil — `lg:` est le défaut Tailwind et correspond
exactement au seuil documenté dans `MAQUETTE.md`. Deux breakpoints custom existent pour
des besoins ponctuels : `xs` (375px) et `map` (900px, mise en page carte spécifique).

```tsx
// ✅ Correct — mobile d'abord, override croissant
<div className="px-4 py-6 lg:px-8 lg:py-10">

// ❌ Incorrect — ordre inversé
<div className="lg:px-8 px-4">
```

Constantes de layout desktop : sidebar `w-58` = 232px, panneau recherche `w-100`/
`min-w-[380px]` = 400px, largeur de lecture max 1040px, modale 560px (`lg:w-140`). Ce
sont des classes Tailwind à paliers en dur — il n'existe pas de variable CSS `--nav-rail`
ou `--search-panel` dans `index.css`, ne pas les inventer dans du code neuf. En dessous
de `lg:`, `.bottom-sheet`/`.bottom-nav` restent `fixed`; au-delà, ils passent en layout
statique (`lg:static`) intégré au flex de la page — jamais de composant ou d'asset
desktop-only, mêmes SVG et tokens partout.

Vérification par `tsc --noEmit`/`eslint`/`vitest run`/`vite build` uniquement ici, en
particulier pour le rendu ≥1024px — voir la limite d'outillage en tête de fichier.

---

## Layout de page — Structure standard

**Page hors carte** (Profil, Dashboard, Récompenses, Paramètres) :

```tsx
import { PageWithSidebar } from '../components/PageWithSidebar'

export function SomePage() {
  return (
    <PageWithSidebar>
      <div className="min-h-screen bg-bg pb-[calc(var(--height-bottomnav)+1rem)] lg:pb-6">
        <main className="max-w-2xl mx-auto px-4 py-5 lg:px-6 lg:max-w-260">
          {/* max-w-260 = 1040px (échelle Tailwind, 4px/unité) — largeur de lecture max desktop.
              padding-bottom réservé à .bottom-nav en mobile (fixed, hors flux). */}
        </main>
      </div>
    </PageWithSidebar>
  )
}
```

**Page carte** (`MapPage`) gère elle-même son flex 3 colonnes (sidebar 232px | panneau
recherche 400px | carte `flex-1`) car sa sidebar doit rester synchronisée avec l'état du
sheet mobile — ne pas la faire passer par `PageWithSidebar`.

**Auth** (`AuthShell`) : plein-bord mobile (header vert 196px pleine largeur, pas de
marge externe) → 2 colonnes dès `lg:` (panneau de marque ~40%/min 380px à gauche,
formulaire centré `max-w-sm` à droite). Le cadre de téléphone arrondi visible dans les
fichiers Claude Design est un chrome de présentation de l'outil, pas l'écran réel — ne
pas le reproduire tel quel en mobile.

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
- Composant pur : logique dans hooks/services, pas dans le JSX

---

## Pièges connus — bugs réels trouvés pendant la migration Estuaire

Ces classes d'erreurs sont faciles à réintroduire par accident. Y penser avant de poser
une règle globale ou un `transform`.

- **Ne jamais poser de règle globale `min-height:48px`/`min-width:48px` sur
  `button, a, [role="button"]`.** `min-height` gagne toujours sur une classe `height`
  plus petite, quelle que soit sa spécificité — ça écrase silencieusement toute l'échelle
  `control-xs/sm/md` (chips, tabs, boutons icône desktop). La cible AA de ce projet est
  `control-lg` (44px), posée composant par composant, pas en règle aveugle.
- **`button, a, [role="button"] { display: flex; align-items: center }` (règle globale de
  `index.css`) ne centre que verticalement.** Un bouton custom sans `justify-center`
  explicite (et sans `.btn-*`, qui le gèrent déjà) reste aligné à gauche même avec
  `text-center` — sans effet sur un enfant flex texte-seul. Toujours ajouter
  `justify-center` sur un bouton custom en dehors des classes `.btn-*`.
- **`transform: translateY(...)` ignore le `bottom` de l'état d'origine.** Un déplacement
  en bloc rigide ne "voit" pas la valeur `bottom` posée par ailleurs — préférer un `top`
  explicite calculé si le résultat doit rester calé par rapport au bas de l'écran (cas du
  rail de minimisation du bottom sheet, `data-mobile-minimized`).
- **Les panneaux internes Leaflet échappent au contexte d'empilement de
  `.leaflet-container`** (`position: relative` sans `z-index` ne crée pas de contexte) —
  tout élément de chrome applicatif superposé à la carte (sheet, panneau) a besoin d'un
  `z-index` explicite (`z-sheet`/`z-modal`/`z-toast`) pour ne pas se faire recouvrir.
- **Un `[data-theme="dark"], @media (prefers-color-scheme: dark) { ... }` combiné dans un
  même sélecteur n'est pas du CSS valide** — lightningcss l'ignore silencieusement (le
  mode sombre semble alors "ne pas s'appliquer"). Toujours déclarer les deux cas
  séparément, quitte à dupliquer les valeurs (déjà fait dans `index.css`).
- **Vérifier les contrastes réels des tokens sombres avant de les considérer acquis.**
  Deux tokens du fichier `DESIGN-SYSTEM.md` d'origine étaient réellement cassés en
  contraste une fois rendus (`--color-on-primary-muted` ~1,1:1, `--color-text-subtle`
  4,4:1, sous le seuil AA) — corrigés directement en code. Ne pas recopier aveuglément
  une valeur de token depuis la doc sans vérifier qu'elle correspond à `index.css`.

---

## Interdictions formelles

- PAS de valeur hex en dur dans les classes (`text-[#0B5C43]`) — utiliser `text-primary`
- PAS de `style={{ color: '...' }}` sauf `--mode-color`/`--mode-surface` (chips, tracés
  Leaflet) et les couleurs de polyline Leaflet elles-mêmes
- PAS de `text-slate-*`, `bg-gray-*`, `text-zinc-*`, `text-indigo-*`, `text-red-*` —
  palette Tailwind brute hors du design system. Utiliser les tokens sémantiques
  (`text`/`text-muted`/`text-subtle`, `danger`, `warning`…)
- PAS de `backdrop-blur`/`backdrop-filter`/glassmorphism — interdit sous Estuaire
- PAS d'emoji comme icône fonctionnelle — un seul jeu d'icônes SVG (`mode-icons.tsx`)
- PAS d'animation décorative en boucle continue (pulsation permanente, spin, bounce)
- PAS de top app-bar dupliquant `BottomNav`/la sidebar — la nav vit à un seul endroit
- PAS de règle globale `min-height`/`min-width: 48px` sur les éléments interactifs (voir
  « Pièges connus »)
- PAS de nouvelle utilisation des rampes `eco-*`/`transit-*` ou des alias `radius-card`/
  `radius-button`/`shadow-float` dans du code neuf (legacy uniquement — `shadow-card-md`
  n'est pas concerné, c'est un token actif)
- PAS de `outline-none` sans focus visible compensatoire
- PAS de `!important` Tailwind sauf override Leaflet documenté ou cas de spécificité
  explicitement commenté (ex. rail de minimisation du bottom sheet)
