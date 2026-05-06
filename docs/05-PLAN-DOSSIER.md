# Plan du dossier — 40 pages maximum

## Budget page par page

| # | Section | Pages | Exigence couverte |
|---|---------|-------|-------------------|
| | Page de garde + sommaire | 2 | — |
| 1 | **Contexte et objectifs** | 3 | « Explicitation des objectifs client » |
| 2 | **Pilotage et gestion de projet** | 6 | « Proposez différentes solutions, approche, rôles » |
| 3 | **Diagrammes UML** | 8 | « 3 diagrammes avec description » |
| 4 | **Spécifications** | 8 | « Spéc. fonct. et tech. d'1 fonctionnalité clé » |
| 5 | **Architecture technique** | 5 | « Évolutivité et maintenabilité » |
| 6 | **Contraintes transversales** | 5 | C1–C12 |
| 7 | **Gestion des bogues** | 2 | « Approche bugs pré-production » |
| 8 | **Conclusion et perspectives** | 1 | Ouverture |
| | **TOTAL** | **40** | |

---

## Détail de chaque section

### 1. Contexte et objectifs (3 pages)

| Sous-section | Pages | Contenu |
|-------------|-------|---------|
| Reformulation du besoin client | 1 | Reprendre l'email de Claire Hénette, reformuler en objectifs clairs |
| Parties prenantes + persona | 0.5 | Identifier les acteurs (métropole, citoyens, opérateurs). Persona utilisateur type |
| Périmètre MVP + hors-périmètre + choix Nantes | 1 | Justifier la ville réelle, lister ce qui est inclus et exclu |
| KPIs de succès | 0.5 | Métriques mesurables (temps de réponse, score Lighthouse, couverture fonctionnelle) |

### 2. Pilotage et gestion de projet (6 pages)

| Sous-section | Pages | Contenu |
|-------------|-------|---------|
| Comparatif 3 approches globales | 2 | Native (Flutter) vs Low-code (Bubble) vs **PWA React**. Grille multicritères vs contraintes C1-C12. Recommandation argumentée |
| Méthodologie Scrum solo | 1 | Sprints adaptés solo, rituels simplifiés, outils (GitHub Projects) |
| Environnement et outils | 0.5 | Liste outillage dev (IDE, linter, CI, versioning) |
| Planning Gantt | 0.5 | 6 sprints × 2 semaines, jalons clés, livrables par sprint |
| Démarche DMAIC appliquée | 1 | Cas concret : optimisation temps de réponse itinéraire via `Promise.all()` |
| Rôles et répartition temporelle | 1 | Casquettes en projet solo, répartition temps dev/design/rédaction |

#### Point DMAIC — Cas concret (ne dépend PAS de Redis)

- **Define** : Le temps de réponse du calcul d'itinéraire dépasse 3s en test
- **Measure** : Mesure p50, p95, p99 sur 50 requêtes
- **Analyze** : Appel Transitous (800ms) + appel OpenWeather (1200ms) sont séquentiels
- **Improve** : Parallélisation via `Promise.all([transitous, weather])` + cache mémoire météo 10min
- **Control** : Logging temps de réponse par endpoint, alerte si p95 > 2s

### 3. Diagrammes UML (8 pages)

| Diagramme | Pages | Ce qu'il montre |
|-----------|-------|-----------------|
| Cas d'utilisation | 2.5 | Acteurs (citoyen, système, APIs) et fonctionnalités. Description textuelle des cas principaux |
| Séquences | 3 | Flux complet du calcul d'itinéraire : utilisateur → frontend → backend → Transitous → scoring → réponse |
| Communication | 1.5 | Interactions entre objets pour la demande d'itinéraire |
| Activité (bonus) | 1 | Logique de décision du scoring multimodal (branchements si pluie, si préférence éco, etc.) |

#### ⚠️ Point sensible : diagramme de communication

Le sujet l'exige explicitement. Le remplacer par un diagramme d'activité est risqué sans accord du formateur.

**Option sûre** : faire les deux — communication (1.5 pages) + activité (1 page bonus) — en réduisant « Environnement et outils » de 0.5 page.

**Justification à écrire si remplacement** : « Nous avons substitué le diagramme de communication par un diagramme d'activité car la logique de décision du scoring multimodal nécessite la modélisation de branchements conditionnels que seul le diagramme d'activité peut exprimer. »

> **Chaque diagramme doit avoir au minimum 10-15 lignes de description textuelle.** C'est une exigence explicite du sujet.

### 4. Spécifications (8 pages)

Fonctionnalité clé choisie : **le planificateur multimodal (F2)**.

| Sous-section | Pages | Contenu |
|-------------|-------|---------|
| Spécifications fonctionnelles | 3 | User stories, critères d'acceptation, maquettes wireframe, flux utilisateur |
| Spécifications techniques | 3 | Appel Transitous (format requête/réponse), algorithme de scoring, modèle de données associé, contrat d'API |
| Règles de gestion et cas limites | 2 | Géolocalisation indisponible, API timeout, itinéraire introuvable, hors zone Nantes, mode démo |

### 5. Architecture technique (5 pages)

| Sous-section | Pages | Contenu |
|-------------|-------|---------|
| Schéma d'architecture globale | 1.5 | Le diagramme (voir 03-ARCHITECTURE.md) + légende |
| Justification monolithe modulaire | 1 | Pourquoi pas microservices. Pattern Stratégie documenté |
| Modèle de données (schéma BDD) | 1.5 | Schéma PostgreSQL, relations, index PostGIS |
| Interopérabilité (C9) | 1 | API REST exposée + Swagger. Pas seulement consommation d'APIs |

### 6. Contraintes transversales (5 pages)

| Contrainte | Pages | Contenu |
|-----------|-------|---------|
| PWA + performances (C1, C10) | 1 | Manifest, service worker, mode offline partiel, stratégie cache |
| Accessibilité WCAG 2.1 AA (C7, C12) | 1 | Audit Axe, contrastes, navigation clavier, labels formulaires, alt images |
| Sécurité OWASP + RGPD (C4, C8, C11) | 1.5 | Helmet, rate limit, JWT HttpOnly, hashage bcrypt, consentement géolocalisation, durée conservation, droit à l'effacement |
| Éco-conception avec métriques (C5) | 1 | Bundle audit (ko), requêtes HTTP/page, score Lighthouse, choix Leaflet (40ko) vs Google Maps (200ko+), hébergement CDN + veille auto |
| Géolocalisation (C6) | 0.5 | Précision GPS, fallback réseau, fallback saisie manuelle |

### 7. Gestion des bogues (2 pages)

| Sous-section | Pages | Contenu |
|-------------|-------|---------|
| Stratégie de tests | 1 | Unitaires (Vitest, scoring), intégration (API endpoints), accessibilité (Axe DevTools) |
| Workflow bug | 1 | Signalement (GitHub Issues) → triage (criticité) → fix → retest → merge. Labels, template d'issue |

### 8. Conclusion et perspectives (1 page)

- Bilan du MVP réalisé
- Perspectives : migration OTP auto-hébergé, extension à d'autres villes, temps réel SIRI complet
- Contribution à l'open data (démarche SIRI Naolib pour Transitous)

---

## Annexes suggérées (hors pagination des 40 pages si le format le permet)

- Capture d'écran Lighthouse (4 scores verts)
- Capture Swagger de l'API exposée
- Extrait de code du pattern Stratégie
