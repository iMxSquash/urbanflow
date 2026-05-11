# CLAUDE.md — UrbanFlow SmartRoute

## Projet

Plateforme de mobilité urbaine multimodale (PWA) pour Nantes Métropole.
Projet académique — Titre 6 CDSD (RNCP 36146), session septembre 2026.
Développeur solo. Le prototype doit fonctionner en démo de soutenance.

si besoin d'info supplémentaire : `/docs`

## Territoire

Nantes Métropole — réseau Naolib (Semitan). Toutes les coordonnées GPS, données de test et adresses utilisent la métropole nantaise. Centre carte par défaut : `lat: 47.218, lng: -1.553` (Commerce).

## Stack

### Frontend
- React 18 + TypeScript (strict mode activé)
- Vite comme build tool
- TailwindCSS pour le styling (classes utilitaires uniquement, pas de CSS custom sauf exception)
- Zustand pour le state management (PAS Redux, PAS Context API seul)
- Leaflet.js pour la cartographie (tuiles CartoDB Positron)
- Recharts pour les graphiques du dashboard
- vite-plugin-pwa pour le service worker et le manifest

### Backend
- Node.js + Express + TypeScript
- PostgreSQL + extension PostGIS pour les requêtes géospatiales
- Zod pour la validation des entrées (PAS Joi, PAS express-validator)
- Swagger/OpenAPI via swagger-jsdoc + swagger-ui-express
- Helmet + express-rate-limit + cors pour la sécurité

### Auth
- JWT avec access token (15min) + refresh token en cookie HttpOnly
- bcrypt pour le hashage des mots de passe
- Jamais stocker de token dans localStorage

### Tests
- Vitest pour les tests unitaires et d'intégration
- Axe DevTools pour l'accessibilité (pas dans la CI, exécution manuelle)

### CI/CD
- GitHub Actions : lint + build uniquement (PAS de Lighthouse CI, instable sur runners partagés)
- Déploiement : Vercel (frontend) + Render (backend + PostgreSQL)

## Architecture

Monolithe modulaire. PAS de microservices.

```
src/
├── client/                  # Frontend React
│   ├── components/
│   ├── pages/
│   ├── stores/              # Stores Zustand
│   ├── hooks/
│   ├── services/            # Appels API
│   ├── types/
│   └── utils/
├── server/                  # Backend Express
│   ├── modules/
│   │   ├── auth/            # Inscription, connexion, JWT
│   │   ├── profile/         # Profil de mobilité
│   │   ├── routing/         # Orchestrateur itinéraires + scoring
│   │   ├── gamification/    # Points, badges, dashboard
│   │   └── transport/       # Couche abstraction providers
│   ├── middleware/           # helmet, rate-limit, cors, auth guard, zod validation
│   ├── config/              # Variables d'env, constantes
│   ├── db/                  # Pool PostgreSQL, migrations SQL
│   └── utils/
├── shared/                  # Types partagés front/back
│   └── types/
└── demo-data/               # JSON statiques mode démo
    ├── journey-sunny.json
    ├── journey-rainy.json
    ├── weather-sunny.json
    ├── weather-rainy.json
    ├── stations-bicloo.json
    └── departures-stop.json
```

## Pattern Stratégie — Transport Providers

C'est le point architectural central. Le module routing ne connaît JAMAIS directement Transitous ou OTP. Il passe par une interface.

```typescript
// server/modules/transport/transport-provider.interface.ts
export interface TransportProvider {
  getJourneys(from: Coordinates, to: Coordinates, options: JourneyOptions): Promise<Journey[]>
}
```

Trois implémentations :
- `TransitousProvider` — production cloud (api.transitous.org, API MOTIS)
- `OTPProvider` — développement local (localhost:8080, GraphQL)
- `DemoProvider` — mode démo (fichiers JSON statiques)

Sélection via variable d'environnement `TRANSPORT_PROVIDER=transitous|otp|demo`.

## Mode démo

Variable d'env `DEMO_MODE=true` fait basculer TOUS les appels API externes vers des fichiers JSON dans `demo-data/`. Cela inclut Transitous, OpenWeather, GBFS Bicloo. Le mode démo doit toujours fonctionner, même sans connexion réseau côté backend. C'est le filet de sécurité pour la soutenance.

## APIs externes

| API | Variable d'env | Usage |
|-----|---------------|-------|
| Transitous | `TRANSITOUS_URL=https://api.transitous.org/api/` | Routage multimodal (cloud) |
| OTP | `OTP_URL=http://localhost:8080` | Routage multimodal (dev local) |
| OpenWeatherMap | `OPENWEATHER_API_KEY=xxx` | Météo pour scoring |
| GBFS Bicloo | URL fixe transport.data.gouv.fr | Stations vélos |
| SIRI-Lite Naolib | `RequestorRef: opendata` | Prochains passages temps réel |
| CartoDB Positron | URL fixe basemaps.cartocdn.com | Tuiles cartographiques |

## Variables d'environnement

```env
# Base de données
DATABASE_URL=postgresql://user:pass@host:5432/urbanflow

# Transport provider
TRANSPORT_PROVIDER=transitous  # transitous | otp | demo

# Mode démo (surcharge tout)
DEMO_MODE=false

# APIs
TRANSITOUS_URL=https://api.transitous.org/api/
OTP_URL=http://localhost:8080
OPENWEATHER_API_KEY=

# Auth
JWT_SECRET=
JWT_REFRESH_SECRET=
JWT_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Serveur
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

## Conventions de code

### TypeScript
- Mode strict activé (`"strict": true` dans tsconfig)
- Pas de `any`. Utiliser `unknown` puis type guard si nécessaire
- Interfaces pour les contrats, types pour les unions/intersections
- Les types partagés front/back vont dans `shared/types/`

### Nommage
- Fichiers : kebab-case (`transport-provider.ts`, `journey-card.tsx`)
- Composants React : PascalCase (`JourneyCard.tsx` pour le composant, `journey-card.tsx` pour le fichier)
- Interfaces : préfixe I interdit. Juste `TransportProvider`, pas `ITransportProvider`
- Variables d'env : SCREAMING_SNAKE_CASE

### React
- Composants fonctionnels uniquement (pas de classes)
- Hooks personnalisés préfixés `use` dans `hooks/`
- Pas de logique métier dans les composants — déléguer aux stores Zustand et services
- Pas de `useEffect` pour les appels API — utiliser un hook dédié ou une lib (TanStack Query si nécessaire)

### Express
- Chaque module a ses propres routes, controllers, services
- Les controllers ne contiennent que la logique HTTP (parsing req, envoi res)
- La logique métier va dans les services
- Validation Zod en middleware, jamais dans le controller
- Toujours retourner des erreurs JSON structurées : `{ error: string, details?: unknown }`

### SQL / PostGIS
- Migrations numérotées : `001-create-users.sql`, `002-create-profiles.sql`
- Utiliser les types PostGIS `GEOGRAPHY(POINT, 4326)` pour les coordonnées
- Pas d'ORM. Requêtes SQL directes via `pg` (node-postgres)
- Parameterized queries uniquement (`$1, $2`) — JAMAIS de string interpolation

### CSS / Tailwind
- TailwindCSS classes utilitaires uniquement
- Pas de fichiers CSS custom sauf reset minimal
- Responsive : mobile-first (classes sans préfixe = mobile, `md:` = tablette, `lg:` = desktop)
- Palette de couleurs cohérente via tailwind.config.ts (tokens projet)

## Accessibilité (WCAG 2.1 AA) — Obligatoire

- Tout `<img>` a un attribut `alt`
- Tout champ de formulaire a un `<label>` associé ou `aria-label`
- Contrastes ≥ 4.5:1 pour le texte normal, ≥ 3:1 pour le texte large
- Navigation clavier fonctionnelle (focus visible, tabindex logique)
- Boutons icône : toujours un `aria-label`
- La carte Leaflet doit avoir un `role="application"` et un `aria-label`
- Tester avec Axe DevTools avant chaque merge significatif

## Éco-conception — Principes à respecter

- Bundle frontend < 300 ko gzip (vérifier avec `vite-bundle-visualizer`)
- Lazy loading des routes/pages React (`React.lazy` + `Suspense`)
- Images compressées (WebP si possible)
- Pas de polyfills inutiles
- Pas de bibliothèques lourdes sans justification
- Minimiser les appels API : ne pas appeler si les données sont déjà en cache Zustand
- Cache mémoire (Map JS) de la météo OpenWeather pendant 10 minutes
- Paralléliser les appels API indépendants avec `Promise.all()`

## Sécurité (OWASP) — Règles strictes

- Helmet activé sur toutes les routes
- Rate limiting global (100 req/15min par IP pour l'auth)
- CORS restreint à l'origine du frontend
- Validation Zod de toutes les entrées utilisateur
- Hashage bcrypt (rounds ≥ 10)
- JWT access token : durée courte (15min)
- Refresh token : cookie HttpOnly, Secure, SameSite=Strict
- Pas de données sensibles dans les JWT (juste user id + email)
- Sanitization des sorties (pas de HTML brut dans les réponses)
- Headers CSP via Helmet

## RGPD — Points obligatoires

- Popup de consentement AVANT activation de la géolocalisation
- L'utilisateur peut désactiver la géolocalisation et saisir manuellement
- Endpoint `DELETE /api/users/me` pour le droit à l'effacement
- Durée de conservation des données de trajets : 12 mois max, documenté dans le dossier
- Aucun partage de données GPS à des tiers

## Facteurs CO2 (ADEME)

Constantes à utiliser pour le scoring :

```typescript
// shared/constants/co2-factors.ts
export const CO2_FACTORS = {
  car: 253,        // g CO2e/km — référence voiture pour calcul économie
  bus: 109,        // g CO2e/km/passager
  tramway: 4,      // g CO2e/km/passager (électrique)
  bike: 0,         // g CO2e/km
  walk: 0,         // g CO2e/km
  scooter: 0,      // g CO2e/km (électrique)
} as const
```

Score CO2 d'un itinéraire = somme des (distance_segment_km × facteur_mode).
Économie CO2 = score_voiture_equivalent – score_itinéraire_choisi.
Source à citer : Base Empreinte de l'ADEME.

## Scoring itinéraire — Logique métier

Le moteur de scoring est un algorithme déterministe multicritères, PAS un modèle ML.
Ne jamais le présenter comme de l'IA. L'appeler « moteur d'optimisation multicritères ».

```
score_final = (w_duree × score_duree) + (w_co2 × score_co2) + (w_confort × score_confort)

Pondérations ajustées par :
- Préférences utilisateur (eco/fast/balanced)
- Météo (pluie → w_confort_tc augmente, w_velo diminue)
- Heure (heure de pointe → w_tc augmente si fréquence élevée)
```

## Git

- Branche principale : `main`
- Feature branches : `feat/nom-feature`
- Fix branches : `fix/nom-bug`
- Commits conventionnels : `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`
- PR obligatoire vers main (même en solo, pour l'historique)

## Philosophie de résolution de problèmes

Quand un comportement inattendu se produit (double appel, effet de bord, race condition...) :
- **Ne jamais contourner** avec un flag, un guard ou un hack (ex: variable module-level pour bloquer un double appel)
- **Chercher la cause racine** et la corriger proprement (ex: AbortController + cleanup dans useEffect)
- Un contournement masque le problème et crée de la dette technique

## Ce qu'il ne faut PAS faire

- PAS de microservices
- PAS de Redux (utiliser Zustand)
- PAS de LLM/ChatGPT/modèle ML (contradiction éco-conception)
- PAS d'ORM (requêtes SQL directes)
- PAS de localStorage pour les tokens (cookie HttpOnly)
- PAS de Lighthouse dans la CI GitHub Actions (instable)
- PAS de Google Maps (lourd + carte bancaire requise)
- PAS de données de ville fictive (utiliser Nantes réel)
- PAS de string interpolation dans les requêtes SQL
- PAS de `any` en TypeScript