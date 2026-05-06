# Prompts Design System — UrbanFlow SmartRoute
# À envoyer dans l'ordre dans Claude Code

## ÉTAPE 1 — Initialiser le design system (Sprint 0)

```
Initialise le design system UrbanFlow SmartRoute.

1. Copie le fichier tailwind.config.ts depuis design-system/tailwind.config.ts
   à la racine du projet (remplace le fichier généré par Vite).

2. Copie globals.css depuis design-system/globals.css
   vers src/client/styles/globals.css.

3. Dans src/client/main.tsx, remplace l'import du CSS Vite par :
   import './styles/globals.css'

4. Vérifie que la font Inter est chargée (Google Fonts dans index.html).

5. Crée src/client/styles/index.ts qui exporte les constantes
   de couleurs de mode de transport pour Leaflet :

   export const MODE_COLORS = {
     walk:    '#94a3b8',
     bike:    '#16a34a',
     tram:    '#2563eb',
     bus:     '#d97706',
     navibus: '#0891b2',
     car:     '#dc2626',
   } as const

6. Lance npm run dev et vérifie qu'il n'y a pas d'erreur de compilation.
```

---

## ÉTAPE 2 — Composants de base UI (Sprint 1, debut)

```
[contexte projet : PWA mobilité urbaine Nantes, éco-conception C5,
bundle < 300ko, WCAG 2.1 AA obligatoire, Tailwind uniquement]

En utilisant le skill urbanflow-design et le skill frontend-design,
crée les composants de base dans src/client/components/ui/ :

1. Button.tsx
   - Variants : primary, secondary, ghost, eco
   - Props : variant, size (sm/md/lg), loading (spinner), disabled
   - Toujours min-h-[48px], focus-visible, aria-disabled quand loading

2. Input.tsx
   - Avec label intégré (prop label required)
   - Variants : default, error, success
   - Props : label, error, hint, leftIcon, rightIcon
   - WCAG : htmlFor auto-généré depuis le prop id

3. Badge.tsx
   - Pour les modes de transport (walk, bike, tram, bus, navibus)
   - Avec icône emoji et label
   - Taille fixe, pas d'interaction

4. Card.tsx
   - Wrapper réutilisable
   - Props : padding, shadow, hover, className

5. Spinner.tsx
   - Petit (16px), Moyen (24px), Grand (40px)
   - Couleur eco-600 par défaut
   - aria-label="Chargement en cours"

Génère un fichier src/client/components/ui/index.ts
qui exporte tous ces composants.
```

---

## ÉTAPE 3 — Composant JourneyCard (Sprint 2)

```
[contexte : design system UrbanFlow, éco-conception, WCAG AA]

En utilisant le skill urbanflow-design et frontend-design,
crée src/client/components/journey/JourneyCard.tsx.

Le composant affiche un itinéraire multimodal proposé par Transitous.

Props :
- journey: Journey (type depuis src/shared/types/journey.ts)
- isSelected: boolean
- onSelect: () => void
- rank: 1 | 2 | 3 (pour le label "Recommandé", "Alternatif", etc.)

Affichage :
┌──────────────────────────────────────────────────┐
│ [rank badge]  [mode badges en ligne]              │
│                                                  │
│ 23 min        4g CO₂ économisés    ✦ 85 pts      │
│ Départ 14:32 · Arrivée 14:55                     │
│                                                  │
│ [Choisir cet itinéraire]                        │
└──────────────────────────────────────────────────┘

- Border-left colorée selon le mode principal du trajet
- CO2 : vert si économie positive, slate si neutre
- État sélectionné : border eco-600, bg eco-50
- Zone tactile complète (le clic sur toute la card = onSelect)
- Accessible : role="button", aria-pressed={isSelected}, aria-label descriptif

Lance /check-a11y sur ce composant après génération.
```

---

## ÉTAPE 4 — Page du planificateur (Sprint 2-3)

```
[contexte : design system UrbanFlow, mobile-first, PWA]

En utilisant urbanflow-design, frontend-design et ui-ux-pro-max,
crée src/client/pages/PlannerPage.tsx.

Layout mobile (< 1024px) :
- Carte Leaflet : 50vh, pleine largeur
- Panel scrollable en dessous : recherche A→B + résultats

Layout desktop (>= 1024px) :
- Split 40% panel | 60% carte
- Panel fixe avec scroll interne

Contenu du panel :
1. Barre de recherche départ / arrivée (avec bouton inverser)
2. Bouton "Utiliser ma position" (GPS)
3. Filtres rapides : préférence éco/rapide/équilibré (3 toggle buttons)
4. Liste des JourneyCard (skeleton pendant le chargement)
5. Message d'état vide (si aucun itinéraire)

États à gérer :
- idle (aucune recherche)
- loading (skeleton animé)
- results (liste de JourneyCard)
- error (message d'erreur avec retry)
- empty (aucun itinéraire trouvé)

Le store Zustand routing fournit les données.
Pas de logique métier dans le composant.
Lance /check-a11y après génération.
```

---

## ÉTAPE 5 — Dashboard gamification (Sprint 4)

```
[contexte : design system UrbanFlow, données ADEME CO2, WCAG AA]

En utilisant urbanflow-design, frontend-design et high-end-visual-design,
crée src/client/pages/DashboardPage.tsx.

Section 1 — Hero CO2 (en haut, prominent)
┌──────────────────────────────┐
│  Ce mois-ci, vous avez évité │
│  ██ 12,4 kg CO₂ ██           │
│  (vs voiture)                │
└──────────────────────────────┘
Chiffre en text-display font-bold text-eco-700
Animation count-up au montage

Section 2 — Graphique hebdomadaire
Recharts BarChart : CO2 économisé par semaine, 4 dernières semaines
Couleur des barres : eco-400
Axes en text-caption text-slate-400
aria-label sur le graphique : "Graphique CO2 économisé par semaine"

Section 3 — Répartition des modes
Recharts PieChart : % de chaque mode utilisé ce mois
Couleurs : MODE_COLORS depuis src/client/styles/index.ts
Légende textuelle sous le graphique (pas seulement couleurs)

Section 4 — Badges
Grille 3 colonnes (mobile : 2 colonnes)
BadgeCard : débloqué (coloré) / verrouillé (grisé, opacity-60)
Chaque badge a un aria-label décrivant la condition

Toutes les données viennent du store Zustand gamification.
Lance /check-a11y après génération.
```

---

## ÉTAPE 6 — Audit visuel final (Sprint 5)

```
En utilisant le MCP Playwright, fais un audit visuel complet de l'application.

1. Ouvre http://localhost:5173
2. Prends des screenshots de chaque page principale :
   - Page de connexion
   - Planificateur (avec résultats chargés en mode démo)
   - Carte avec stations vélos visibles
   - Dashboard gamification
   - Page de profil

3. Pour chaque screenshot, vérifie :
   - La cohérence des couleurs avec le design brief
   - La lisibilité sur fond blanc
   - La hiérarchie visuelle (qu'est-ce qui attire l'oeil en premier ?)
   - La présence des badges de mode colorés sur les JourneyCard
   - La taille des zones tactiles (visuellement adequates ?)

4. Signale tout écart par rapport au design system urbanflow-design.

5. Génère un rapport de 10 points maximum, par ordre de priorité.
```

---

## ÉTAPE 7 — Rapport éco-conception (Sprint 5)

```
En utilisant vite-bundle-visualizer, génère le rapport d'éco-conception.

1. Lance : npx vite-bundle-visualizer

2. Ouvre le rapport et identifie les 3 plus grosses dépendances.

3. Pour chacune, vérifie si :
   - L'import est complet ou partiel (tree-shaking possible ?)
   - Une alternative plus légère existe
   - Elle est vraiment nécessaire au MVP

4. Calcule le bundle total gzip et compare à la limite de 300 ko.

5. Si le bundle dépasse 300 ko :
   - Identifie les optimisations possibles (lazy loading, imports partiels)
   - Propose les modifications de code concrètes

6. Génère une capture du score Lighthouse Performance :
   - Lance Lighthouse sur http://localhost:5173 via Playwright
   - Score cible : >= 85 sur Performance, Accessibility, PWA
   - Sauvegarde le screenshot en public/lighthouse-score.png pour le dossier
```