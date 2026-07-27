---
name: check-eco
description: Audit d'éco-conception (bundle, lazy loading, appels réseau, cache) sur le frontend. Utiliser avant un merge qui ajoute une dépendance, une page ou des appels API, ou quand l'utilisateur demande un audit éco.
---

# Audit éco-conception

Budget de référence (CLAUDE.md) : **bundle frontend < 300 ko gzip**, appels API minimisés, cache météo 10 min, appels indépendants parallélisés.

## Périmètre

- Avec argument : `/check-eco src/client/pages/DashboardPage.tsx` → auditer ce fichier.
- Sans argument : audit complet du frontend (`src/client/`) + mesure du bundle.

## Checks

### 1. Mesure du bundle (toujours en premier en audit complet)
```bash
npx vite build 2>&1 | tail -30
```
Relever la taille gzip de chaque chunk. Si le total dépasse 250 ko gzip (marge d'alerte avant le plafond de 300), identifier les 3 plus gros chunks avec `npx vite-bundle-visualizer` et remonter les coupables.

### 2. Imports de bibliothèques
- Pas d'import de bibliothèque entière quand un import ciblé suffit :
  `grep -rn "import \* as\|from 'lodash'\|from 'date-fns'$" src/client --include="*.ts*"`
- Recharts : imports nommés (`import { LineChart, Line } from 'recharts'`), jamais l'entrée globale.
- Toute **nouvelle** dépendance dans le diff doit être justifiée : vérifier son coût avec `npm ls <pkg>` et sa taille sur le build avant/après. Proposer l'alternative native (Intl, fetch, CSS) si elle existe.

### 3. Lazy loading
- Chaque page dans `src/client/pages/` est chargée via `React.lazy()` + `Suspense` dans le routeur — vérifier qu'aucun import statique de page n'a été réintroduit :
  `grep -n "from './pages\|from '@/pages" src/client/App.tsx src/client/main.tsx`
- Les composants lourds hors parcours initial (Recharts du dashboard, carte Leaflet si absente de l'écran d'accueil) sont dans des chunks séparés — confirmer via la liste des chunks du build.

### 4. Appels réseau
- Pas d'appel API si la donnée est déjà dans un store Zustand : tout `fetch`/service appelé au montage doit d'abord tester le store.
- Pas de `useEffect` qui fetch sans cleanup (`AbortController`) — cause de doubles appels en StrictMode (cause racine, pas de flag de contournement).
- Pas de polling (`setInterval`) sur des données statiques ou rarement changeantes.
- Appels indépendants parallélisés avec `Promise.all()`, jamais en `await` séquentiels.
- Côté serveur : le cache météo (`src/server/modules/routing/weather.service.ts`) reste une Map JS avec TTL 10 min — vérifier qu'aucun nouvel appel OpenWeather ne le contourne.

### 5. Assets
- Images en WebP (ou SVG pour les pictos). Signaler tout PNG/JPEG > 50 ko dans `src/client/` et `public/`.
- Icônes de transport : SVG inline ou sprite, pas de fichiers image individuels chargés en HTTP.
- Pas de police externe ajoutée (les webfonts tierces = requêtes + CLS) sans justification.

### 6. Rendu
- Pas de re-render en cascade évitable : sélecteurs Zustand fins (`useStore(s => s.x)`) plutôt que déstructuration du store entier.
- Pas de calcul coûteux (tri/filtrage de listes d'itinéraires) refait à chaque render sans `useMemo`.

## Sortie

Tableau : `fichier:ligne | problème | optimisation proposée | impact estimé` (ko sur le bundle, ou requêtes réseau économisées). Classer par impact décroissant.

Terminer par le verdict budget : taille gzip actuelle vs plafond 300 ko, et la tendance si le diff en ajoute.

Ne PAS appliquer les optimisations automatiquement : lister, chiffrer, laisser l'utilisateur arbitrer.
