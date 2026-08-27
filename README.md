<p align="center">
  <img src="public/favicon.svg" width="72" height="72" alt="Logo UrbanFlow">
</p>

<h1 align="center">UrbanFlow</h1>

<p align="center">
  Planificateur d'itinéraires multimodal éco-responsable pour Nantes Métropole.
</p>

<p align="center">
  <a href="https://github.com/iMxSquash/urbanflow/actions/workflows/ci.yml"><img src="https://github.com/iMxSquash/urbanflow/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <img src="https://img.shields.io/badge/node-%3E%3D22-339933?logo=node.js&logoColor=white" alt="Node >=22">
  <img src="https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white" alt="TypeScript strict">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-All%20Rights%20Reserved-lightgrey" alt="All Rights Reserved"></a>
</p>

UrbanFlow SmartRoute est une PWA qui combine transports en commun, vélo, marche et trottinette pour proposer à un usager de Nantes Métropole l'itinéraire le plus adapté à ses préférences (rapide, économe en CO2, ou confortable), via un moteur d'optimisation multicritères déterministe (pas de LLM, pas de ML).

Projet académique solo réalisé dans le cadre du Titre 6 Concepteur Développeur Solutions Digitales (RNCP 36146), session septembre 2026.

> [!NOTE]
> Le dossier de cadrage complet (périmètre, stack, architecture, backlog, points de vigilance) vit dans [`docs/`](docs/).

## Sommaire

- [Sommaire](#sommaire)
- [Fonctionnalités](#fonctionnalités)
- [Stack technique](#stack-technique)
- [Architecture](#architecture)
- [Démarrage rapide](#démarrage-rapide)
  - [Prérequis](#prérequis)
  - [Installation](#installation)
  - [Base de données](#base-de-données)
  - [Variables d'environnement](#variables-denvironnement)
  - [Lancer l'application](#lancer-lapplication)
- [Scripts disponibles](#scripts-disponibles)
- [Variables d'environnement](#variables-denvironnement-1)
- [Mode démo](#mode-démo)
- [Tests et qualité](#tests-et-qualité)
- [Déploiement](#déploiement)
- [Structure du projet](#structure-du-projet)

## Fonctionnalités

- **Planificateur multimodal** : carte Leaflet interactive, 2 à 3 propositions d'itinéraires combinant bus, tramway, navibus, train, vélo, marche et trottinette, avec durée, distance et empreinte CO2 par trajet.
- **Moteur de scoring multicritères** : pondération déterministe durée / CO2 / confort selon la préférence de l'utilisateur (éco, rapide, équilibré), avec filtres durs (modes, temps de marche max) et bonus/malus liés à la météo, au dénivelé et à l'accessibilité PMR. Détail complet dans le [CLAUDE.md](CLAUDE.md#scoring-itinéraire--logique-métier).
- **Profil de mobilité** : préférences de transport, confort de marche, accessibilité PMR, sensibilité au dénivelé.
- **Gamification éco-mobilité** : points calculés depuis le CO2 économisé (référence ADEME), badges par seuils, dashboard de progression (Recharts), catalogue de récompenses échangeables contre des points.
- **Authentification robuste** : JWT access court + refresh token en cookie `HttpOnly` à rotation unique, codes de récupération façon NIST SP 800-63B-4 en remplacement de l'email, sans jamais stocker de token en `localStorage`.
- **Conformité RGPD** : consentement de géolocalisation tracé, export et suppression du compte, purge automatique des données de trajet à 12 mois.
- **Mode démo intégral** : bascule à chaud (sans redémarrage serveur) vers des jeux de données JSON pré-enregistrés, garantissant une démo fiable même sans réseau.
- **API REST publique documentée** : endpoints stations vélos, itinéraires et arrêts exposés via Swagger/OpenAPI pour l'interopérabilité.
- **PWA installable** : service worker, manifest, fonctionnement hors-ligne partiel.

## Stack technique

| Côté | Techs |
|------|-------|
| Frontend | React 18 + TypeScript strict, Vite, TailwindCSS, Zustand, Leaflet, Recharts, vite-plugin-pwa |
| Backend | Node.js + Express + TypeScript, PostgreSQL + PostGIS, Zod, Swagger/OpenAPI |
| Auth | JWT (access 15 min + refresh cookie `HttpOnly`), bcrypt, rotation à usage unique |
| Sécurité | Helmet, express-rate-limit, CORS restreint |
| Tests | Vitest |
| CI/CD | GitHub Actions (lint + type-check + build + test), Vercel (frontend), Render (backend), Supabase (PostgreSQL) |

> [!IMPORTANT]
> Pas de microservices, pas de Redux, pas d'ORM, pas de LLM/ML embarqué. Ces choix sont volontaires et justifiés dans [`docs/02-STACK-TECHNIQUE.md`](docs/02-STACK-TECHNIQUE.md).

## Architecture

Monolithe modulaire : un seul backend Express, des modules séparés par domaine métier (`auth`, `profile`, `routing`, `gamification`, `rewards`, `transport`).

Le point architectural central est le **pattern Stratégie** appliqué aux providers de transport : le module `routing` ne connaît jamais directement Transitous ou OSRM, il passe par l'interface `TransportProvider`.

```
Routing service ──▶ TransportProvider (interface)
                       ├── TransitousProvider   (bus, tramway, navibus, train)
                       ├── OsrmProvider          (vélo, marche, trottinette)
                       └── DemoProvider          (tous modes, JSON statiques)
```

Le service `selectProviders()` choisit l'implémentation à activer selon les modes demandés par l'utilisateur, ou bascule intégralement sur `DemoProvider` si `DEMO_MODE=true`. Détail complet dans [`docs/03-ARCHITECTURE.md`](docs/03-ARCHITECTURE.md).

## Démarrage rapide

### Prérequis

- Node.js ≥ 22 et npm ≥ 10 (voir [`.nvmrc`](.nvmrc))
- Docker (pour PostgreSQL + PostGIS en local), ou une instance Postgres/PostGIS accessible

### Installation

```bash
git clone https://github.com/iMxSquash/urbanflow.git
cd urbanflow
npm install
```

### Base de données

```bash
docker compose up -d
```

Démarre un PostgreSQL + PostGIS local sur `localhost:5432` (identifiants dans [`docker-compose.yml`](docker-compose.yml)). Les migrations SQL de [`src/server/db/migrations/`](src/server/db/migrations/) s'appliquent automatiquement au démarrage du serveur.

### Variables d'environnement

```bash
cp .env.example .env
```

Renseigner au minimum `DATABASE_URL`, `JWT_SECRET` et `JWT_REFRESH_SECRET`. Voir la [section dédiée](#variables-denvironnement) pour le détail de chaque variable.

### Lancer l'application

```bash
npm run dev
```

Démarre en parallèle le frontend Vite (`http://localhost:5173`) et l'API Express (`http://localhost:3000`, documentation Swagger sur `/api-docs`).

> [!TIP]
> Sans base de données ni clés d'API externes à portée de main, passer `DEMO_MODE=true` dans `.env` fait fonctionner l'application intégralement sur des données statiques (voir [Mode démo](#mode-démo)).

## Scripts disponibles

| Script | Description |
|--------|-------------|
| `npm run dev` | Frontend (Vite) + backend (tsx watch) en parallèle |
| `npm run dev:client` / `npm run dev:server` | Lance uniquement le frontend / le backend |
| `npm run build` | Build de production du frontend |
| `npm run build:server` | Compile le backend TypeScript vers `dist/` |
| `npm start` | Démarre le serveur compilé (`dist/`) |
| `npm run lint` | ESLint sur l'ensemble du projet |
| `npm run format` | Formatage Prettier |
| `npm run type-check` | Vérification TypeScript stricte (frontend + backend) |
| `npm test` / `npm run test:watch` / `npm run test:coverage` | Tests Vitest |
| `npm run preview` | Prévisualise le build de production du frontend |

## Variables d'environnement

Toutes les variables sont listées dans [`.env.example`](.env.example). Aperçu :

| Variable | Rôle |
|----------|------|
| `DATABASE_URL` | Connexion PostgreSQL (Supabase Transaction Pooler en production) |
| `DEMO_MODE` | Bascule tous les appels externes vers `src/demo-data/` |
| `TRANSITOUS_URL`, `OSRM_URL`, `OPENWEATHER_API_KEY`, `NANTES_API_URL` | APIs de transport et météo |
| `VITE_CARTO_API_KEY` | Tuiles CartoDB Positron (clé gratuite, fair use, voir [`docs/06-APIS-DONNEES.md`](docs/06-APIS-DONNEES.md#7-cartodb-positron--tuiles-carte)) |
| `JWT_SECRET`, `JWT_REFRESH_SECRET`, `JWT_EXPIRY`, `JWT_REFRESH_EXPIRY` | Authentification JWT |
| `PORT`, `NODE_ENV`, `CORS_ORIGIN` | Configuration serveur |

## Mode démo

`DEMO_MODE=true` remplace tous les appels API externes (Transitous, OpenWeather, Bicloo) par des fichiers JSON statiques dans [`src/demo-data/`](src/demo-data/), garantissant une démo fiable même sans connexion réseau.

Un panneau de contrôle à chaud (page Paramètres, réservée aux comptes authentifiés) permet en plus, sans redémarrage serveur, d'activer la météo simulée seule, de forcer un scénario (`sunny`/`rainy`), ou de lancer un scénario de trajet préconfiguré. Ce panneau ne s'affiche que si `DEMO_MODE=true`. Le détail des garanties de sécurité associées est documenté dans [`CLAUDE.md`](CLAUDE.md#mode-démo).

## Tests et qualité

```bash
npm run type-check   # TypeScript strict, frontend + backend
npm run lint          # ESLint, zéro warning toléré en CI
npm test              # Vitest
npm run test:coverage # Vitest + rapport de couverture
```

La CI GitHub Actions (`.github/workflows/ci.yml`) exécute type-check, lint, build et tests à chaque push et pull request vers `main`.

> [!NOTE]
> Lighthouse CI est volontairement exclu du pipeline (instabilité constatée sur runners partagés). L'accessibilité est vérifiée manuellement avec Axe DevTools avant chaque merge significatif touchant l'UI.

## Déploiement

| Composant | Plateforme | Configuration |
|-----------|-----------|----------------|
| Frontend | Vercel | [`vercel.json`](vercel.json) |
| Backend | Render | [`render.yaml`](render.yaml) |
| Base de données | Supabase (PostgreSQL + PostGIS, région `eu-west-3`) | N/A |

Le frontend proxy les requêtes `/api/*` vers l'API Render ; les deux services obtiennent HTTPS automatiquement.

## Structure du projet

```
src/
├── client/          # Frontend React (components, pages, stores Zustand, hooks, services)
├── server/          # Backend Express
│   └── modules/
│       ├── auth/          # Inscription, connexion, JWT, codes de récupération
│       ├── profile/       # Profil de mobilité
│       ├── routing/       # Orchestrateur d'itinéraires + scoring
│       ├── gamification/  # Points, badges, dashboard
│       ├── rewards/       # Catalogue de récompenses
│       └── transport/     # Providers (pattern Stratégie)
├── shared/          # Types partagés front/back
└── demo-data/       # Jeux de données JSON du mode démo
```

Pour aller plus loin : [`docs/01-PERIMETRE-MVP.md`](docs/01-PERIMETRE-MVP.md) (périmètre fonctionnel), [`docs/06-APIS-DONNEES.md`](docs/06-APIS-DONNEES.md) (intégrations API détaillées), [`CLAUDE.md`](CLAUDE.md) (conventions de code et règles métier).
