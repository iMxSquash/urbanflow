# Architecture technique — UrbanFlow SmartRoute

## Principe : Monolithe modulaire

Un seul backend Express avec des modules bien séparés. Pas de microservices.

> « Pour un MVP, les microservices seraient de la sur-ingénierie. La modularité interne (modules séparés par domaine) permet une migration future vers des services indépendants sans refactoring structurel. »

---

## Vue d'ensemble

```
┌──────────────────────────────────────────────────────┐
│                 PWA React + TypeScript                │
│         Vite · Leaflet · Tailwind · Zustand          │
│              Service Worker · CartoDB tiles           │
└─────────────────────┬────────────────────────────────┘
                      │ REST / JSON
                      ▼
┌──────────────────────────────────────────────────────┐
│             API Express + TypeScript                  │
│              Swagger / OpenAPI exposé                 │
│              Mode démo intégré (flag env)             │
│                                                      │
│  ┌──────────┐ ┌──────────┐ ┌────────────┐ ┌───────┐│
│  │   Auth   │ │ Routing  │ │Gamification│ │Profil ││
│  │JWT bcrypt│ │ Scoring  │ │Points Badge│ │Préfs  ││
│  └──────────┘ └──────────┘ └────────────┘ └───────┘│
│                                                      │
│  ┌──────────────────────────────────────────────────┐│
│  │ Middleware : helmet · rate-limit · CORS · zod    ││
│  └──────────────────────────────────────────────────┘│
└──────────┬─────────────────────────┬─────────────────┘
           │                         │
           ▼                         ▼
┌─────────────────────┐  ┌─────────────────────────┐
│ PostgreSQL + PostGIS │  │ JSON statiques (démo)   │
│ Users · Scores ·     │  │ Itinéraires · Météo ·   │
│ Stations vélos       │  │ Stations pré-enregistrés│
└─────────────────────┘  └─────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────────────┐
│                    APIs externes                      │
│  Transitous · OpenWeather · GBFS Bicloo · OSM tiles  │
└──────────────────────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────────────┐
│            API REST publique (C9 interop)             │
│  GET /api/stations · GET /api/itineraires             │
│  GET /api/incidents — documentée Swagger              │
└──────────────────────────────────────────────────────┘
```

---

## Pattern Stratégie — Couche d'abstraction transport

Point architectural clé. Le module Routing ne connaît pas directement Transitous ou OTP.

```typescript
// src/transport/transport-provider.interface.ts
export interface TransportProvider {
  getJourneys(
    from: Coordinates,
    to: Coordinates,
    options: JourneyOptions
  ): Promise<Journey[]>
}

// src/transport/transitous.provider.ts
export class TransitousProvider implements TransportProvider {
  // Implémentation via api.transitous.org (MOTIS API)
  // Utilisé en déploiement cloud
}

// src/transport/otp.provider.ts
export class OTPProvider implements TransportProvider {
  // Implémentation via OTP localhost (GraphQL)
  // Utilisé en développement local
}

// src/transport/demo.provider.ts
export class DemoProvider implements TransportProvider {
  // Implémentation via fichiers JSON statiques
  // Utilisé quand DEMO_MODE=true
}
```

> **Pour le dossier** : « OpenTripPlanner a été retenu comme moteur de référence, validé en développement local avec le GTFS Naolib. Pour le déploiement cloud du MVP, les contraintes mémoire d'OTP (2 Go minimum) étant incompatibles avec notre stratégie d'hébergement éco-conçu sur free tier, nous utilisons l'API Transitous. Le pattern Stratégie permet une migration transparente. »

---

## Mode démo

Flag `DEMO_MODE=true` dans les variables d'environnement.

Quand activé, tous les appels API externes sont remplacés par des fichiers JSON pré-enregistrés :

```
src/demo-data/
├── journey-sunny.json      # Scénario beau temps → vélo favorisé
├── journey-rainy.json      # Scénario pluie → TC favorisé
├── weather-sunny.json      # Réponse OpenWeather mockée (soleil)
├── weather-rainy.json      # Réponse OpenWeather mockée (pluie)
├── stations-bicloo.json    # Stations vélos avec disponibilités
└── departures-stop.json    # Prochains passages à un arrêt
```

Permet de garantir la fiabilité de la démo en soutenance, indépendamment de la disponibilité des APIs.

---

## API REST exposée (interopérabilité C9)

Le sujet exige l'interopérabilité. Cela ne signifie pas seulement consommer des APIs, mais aussi en exposer.

Endpoints publics documentés via Swagger :

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/api/stations` | GET | Liste des stations vélos avec disponibilité |
| `/api/itineraires` | POST | Calcul d'itinéraire multimodal |
| `/api/arrets/:id/departs` | GET | Prochains départs à un arrêt |
| `/api/incidents` | GET | Signalements collaboratifs (si implémenté) |
| `/api-docs` | GET | Documentation Swagger interactive |

---

## Modèle de données (PostgreSQL + PostGIS)

```sql
-- Extension géospatiale
CREATE EXTENSION IF NOT EXISTS postgis;

-- Utilisateurs
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  rgpd_consent_at TIMESTAMPTZ
);

-- Profils de mobilité
CREATE TABLE mobility_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  preferred_modes TEXT[] DEFAULT '{"walk","bike","transit"}',
  max_walk_minutes INTEGER DEFAULT 15,
  preference VARCHAR(20) DEFAULT 'eco', -- 'eco', 'fast', 'balanced'
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Historique des trajets (gamification)
CREATE TABLE trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  origin GEOGRAPHY(POINT, 4326),
  destination GEOGRAPHY(POINT, 4326),
  modes_used TEXT[],
  co2_saved_grams INTEGER,
  points_earned INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Badges
CREATE TABLE badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  threshold_type VARCHAR(50), -- 'trips_bike', 'co2_saved', etc.
  threshold_value INTEGER
);

-- Badges débloqués
CREATE TABLE user_badges (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  badge_id UUID REFERENCES badges(id),
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, badge_id)
);

-- Stations vélos (cache local GBFS)
CREATE TABLE bike_stations (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255),
  location GEOGRAPHY(POINT, 4326),
  capacity INTEGER,
  bikes_available INTEGER,
  updated_at TIMESTAMPTZ
);
```

---

## Déploiement

```
Vercel (HTTPS auto)          Render (HTTPS auto)
┌─────────────────┐          ┌──────────────────────┐
│  Frontend React  │  ──→    │  API Express + TS     │
│  (CDN mondial)   │  REST   │  PostgreSQL + PostGIS │
└─────────────────┘          └──────────────────────┘
                                      │
                             GitHub Actions (CI)
                             lint + build (pas Lighthouse)
```
