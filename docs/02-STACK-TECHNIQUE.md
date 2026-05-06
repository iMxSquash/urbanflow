# Stack technique — Justifications

Chaque choix est justifiable en une phrase devant un jury. C'est le critère.

---

## Frontend

| Outil | Rôle | Justification |
|-------|------|---------------|
| **React 18** | Bibliothèque UI | Standard industrie, écosystème riche, composants réutilisables |
| **TypeScript** | Typage statique | Maintenabilité du code, détection d'erreurs à la compilation |
| **Vite** | Build tool | Build rapide, tree-shaking natif, bundle léger (éco-conception) |
| **TailwindCSS** | Styling | Utilité atomique, pas de CSS mort en prod, performances CSS supérieures |
| **Zustand** | State management | ~1 ko, pas de boilerplate (vs Redux), compatible TS. Argument éco-conception : sobriété de la dépendance |
| **Leaflet.js** | Cartographie | ~40 ko gzippé (vs ~200 ko MapLibre GL), open source, adapté au besoin |
| **Recharts** | Graphiques dashboard | Léger, basé sur D3, intégration React native |
| **vite-plugin-pwa** | PWA | Génération automatique du service worker + manifest |

### Tuiles cartographiques

**CartoDB Positron** (`basemaps.cartocdn.com`) — fond épuré, léger, gratuit sans carte bancaire, visuellement professionnel. Basé sur OSM.

Alternative : tuiles OSM standard (`tile.openstreetmap.org`), mais politique d'usage restrictive et esthétique moins adaptée au projet.

> « Nous avons choisi CartoDB Positron pour son fond épuré qui fait ressortir les tracés d'itinéraires, sa légèreté (éco-conception), et son accès sans carte bancaire (vs Google Maps). »

---

## Backend

| Outil | Rôle | Justification |
|-------|------|---------------|
| **Node.js + Express** | Serveur API | Même langage que le frontend (maintenabilité), écosystème npm, léger |
| **TypeScript** | Typage backend | Cohérence full-stack, interfaces partagées front/back |
| **PostgreSQL + PostGIS** | Base de données | Relationnelle robuste + requêtes géospatiales natives (arrêts dans un rayon) |
| **Zod** | Validation d'entrées | Validation runtime + inférence TypeScript, protection contre injections |
| **Swagger / OpenAPI** | Documentation API | API exposée et documentable (contrainte C9 interopérabilité) |
| **Helmet** | Sécurité HTTP | Headers de sécurité OWASP |
| **express-rate-limit** | Rate limiting | Protection OWASP contre abus |

### Alternative écartée : NestJS

NestJS offre une architecture plus structurée (modules, DI) mais ajoute de la complexité pour un MVP solo. Express avec un découpage modulaire explicite est plus sobre et le périmètre est pleinement maîtrisable.

---

## Authentification

| Outil | Rôle | Justification |
|-------|------|---------------|
| **JWT** | Tokens d'auth | Access token (15min) + refresh token en cookie HttpOnly |
| **bcrypt** | Hashage mdp | Standard OWASP pour le hachage de mots de passe |

---

## APIs externes

| API | Rôle | Gratuit | Justification |
|-----|------|---------|---------------|
| **Transitous** (MOTIS) | Routage multimodal cloud | Oui (non-commercial, accord obtenu via Matrix) | Seule option gratuite avec vrai routage TC pour Nantes |
| **OTP** (localhost) | Routage multimodal dev | Oui (auto-hébergé) | Référence industrie, utilisé pour validation locale |
| **OpenWeatherMap** | Météo temps réel | Oui (free tier) | Pondération météo dans le scoring |
| **GBFS JCDecaux** | Stations vélos Bicloo | Oui (open data) | Disponibilité vélos temps réel |
| **SIRI-Lite Naolib** | Prochains passages arrêt | Oui (clé `opendata`) | Enrichissement TC temps réel |
| **OpenRouteService** | Routage piéton/vélo | Oui (free tier) | Complément pour segments non-TC |

### Note sur Navitia.io

> ⚠️ Navitia.io a fermé son free tier en octobre 2024. L'API n'est plus accessible sans abonnement payant. C'est documenté dans le dossier comme une option écartée lors du comparatif de solutions.

---

## Déploiement

| Service | Rôle | Justification éco-conception |
|---------|------|------------------------------|
| **Vercel** | Frontend (CDN) | Distribution depuis le nœud le plus proche = moins d'énergie en transit. Datacenters AWS avec objectif 100% renouvelable |
| **Render** | Backend + PostgreSQL | Mutualisation des ressources physiques. Mise en veille auto après 15min d'inactivité = consommation à la demande |
| **GitHub Actions** | CI (lint + build) | Pipeline légère. Pas de Lighthouse CI (instable sur runners partagés) |

### Justification hébergement éco-conçu (pour le dossier)

> « Le choix d'infrastructure repose sur trois principes éco-responsables : (1) la distribution CDN du frontend réduit la distance réseau par ressource statique ; (2) la mutualisation backend est préférable à un serveur dédié sous-utilisé ; (3) la mise en veille automatique applique le principe de consommation à la demande. La mise en veille (cold start ~30s) est un comportement souhaitable dans un contexte éco-conçu à trafic intermittent. »

---

## Outillage développement

| Outil | Rôle |
|-------|------|
| ESLint + Prettier | Normes et standards (C3) |
| Vitest | Tests unitaires |
| Axe DevTools | Audit accessibilité WCAG |
| Lighthouse (local) | Audit perf + PWA + a11y |
| vite-bundle-visualizer | Audit bundle éco-conception |

---

## Comparatif pour le dossier (section Pilotage)

Le dossier exige un comparatif de solutions. Voici les 3 approches à comparer :

| Critère | App native (Flutter) | Low-code (Bubble) | **PWA React (retenu)** |
|---------|---------------------|-------------------|-----------------------|
| PWA (C1) | ❌ Pas une PWA | ❌ Pas une PWA | ✅ Natif |
| Éco-conception (C5) | ❌ SDK lourd | ❌ Pas de contrôle bundle | ✅ Bundle maîtrisé |
| Interopérabilité (C9) | Possible | ❌ API limitée | ✅ REST exposé + Swagger |
| Accessibilité (C7) | Complexe | Limité | ✅ WCAG 2.1 AA via HTML |
| Coût | Gratuit (open source) | Payant au-delà du free tier | Gratuit |

> « L'approche PWA React a été retenue car elle satisfait nativement la contrainte C1, permet un contrôle total du bundle pour l'éco-conception (C5), et expose une API REST documentée pour l'interopérabilité (C9). Les alternatives native et low-code ont été écartées pour leur incompatibilité avec au moins deux contraintes du cahier des charges. »
