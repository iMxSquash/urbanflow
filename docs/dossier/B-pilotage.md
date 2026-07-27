# Phase B : Pilotage, analyse et gestion du projet

---

## B1. Comparatif des solutions techniques

Nantes Métropole impose trois contraintes simultanées : une application installable sur terminal mobile sans passer par un store applicatif, un calcul d'itinéraire multimodal en temps réel, et la maîtrise souveraine des données de géolocalisation. Trois familles d'approches ont été étudiées et soumises à une grille multicritères fondée sur les douze contraintes officielles du projet.

| Critère | Application native (Flutter / Kotlin) | Plateforme low-code (Bubble, Glide) | PWA React + TypeScript (retenu) |
|---|---|---|---|
| **C1 - PWA installable** | Incompatible - distribution via App Store / Play Store ; exclut les terminaux sans droits d'installation de store | Support partiel, limité aux fonctionnalités du builder ; aucune garantie d'installation hors store | Natif - manifest + service worker, installation depuis le navigateur sans intermédiaire |
| **C2 - Responsive et UX** | UX native excellente par plateforme, mais deux codebases (iOS + Android) ; charge doublée pour un résultat comparable sur mobile | Responsive limité aux templates du builder, personnalisation UX bloquée sur le scoring et les interactions métier | Tailwind mobile-first, design system UrbanFlow (mode clair et sombre), contrôle total de l'UX ; un seul codebase |
| **C3 - Normes et standards** | Solide (langages standard Flutter/Kotlin), mais hors standards web ouverts | Verrouillage éditeur (vendor lock-in), export limité ; normes web non respectées | Standards web ouverts : HTML5, ES2022, API Service Worker, TypeScript strict, ESLint |
| **C4 - Sécurité OWASP** | Maîtrise possible côté API, mais sécurité du store dépendante de l'éditeur de plateforme | Sécurité non auditable : dépendance totale à l'éditeur ; conformité OWASP non vérifiable | Helmet, rate-limit, CORS, Zod, bcrypt, JWT cookie HttpOnly ; audit OWASP complet maîtrisé |
| **C5 - Éco-conception** | Binaires volumineux (Android + iOS), deux versions à maintenir, build CI double | Plateforme tierce consommatrice de ressources ; aucun contrôle du bundle ni des assets | Contrôle total du bundle (cible < 300 ko gzip), lazy loading des routes, tree-shaking natif Vite |
| **C6 - Géolocalisation** | API GPS native pleine capacité, mais données de localisation transitent par les services tiers du store | Géoloc disponible via l'API du builder, sans contrôle du flux de données ni du consentement utilisateur | API navigateur standard, consentement explicite contrôlé dans l'app, aucune donnée GPS transmise à un tiers |
| **C7 - Accessibilité WCAG 2.1 AA** | Dépend du framework UI retenu ; audit non transposable aux outils web standard (Axe DevTools) | Non auditable via les outils web standard ; conformité WCAG non garantie par le builder | Navigateur standard : audit Axe DevTools complet, navigation clavier, ARIA, contrastes ≥ 4.5:1 |
| **C8 - RGPD** | Maîtrise possible si hébergement propre, mais distribution via store implique des tiers (analytics store) | Données hébergées chez l'éditeur tiers : incompatible avec la clause de souveraineté ; RGPD non maîtrisable | Hébergement choisi, zéro partage de données personnelles ; consentement géoloc, droit à l'effacement (`DELETE /api/users/me`) |
| **C9 - Interopérabilité** | Compatible avec les APIs REST, mais couplage fort si changement de provider de transport | Limité aux connecteurs natifs du builder ; ajout d'un provider non standard impossible | Fetch standard, pattern Stratégie (TransportProvider), OpenAPI 3.0 (Swagger) ; ajout de provider sans modifier le module routing |
| **C10 - Performances mobilité** | Performance native excellente par plateforme, mais binaires lourds et gestion mémoire spécifique à chaque OS | Performances dépendantes du runtime du builder, sans contrôle sur le parallélisme des appels réseau | Appels providers parallélisés (`Promise.all()`), cache Zustand côté client, service worker offline ; cible Lighthouse Performance > 90 |
| **C11 - Sécurité des données de déplacement** | Stockage local sécurisé par l'OS, mais les données transitent par les services analytics et crash reporting du store | Sécurité dépendante de l'éditeur tiers ; chiffrement et gestion des accès aux données de trajet non auditables | HTTPS forcé, authentification JWT sur toutes les routes de données, coordonnées GPS arrondies à 4 décimales avant transmission aux providers |
| **C12 - Normes accessibilité transport** | Dépend du framework UI retenu ; intégration d'un filtre PMR nécessite un connecteur natif par plateforme | Filtre PMR non paramétrable finement, limité aux blocs disponibles dans le builder | Filtre PMR intégré au moteur de scoring : seuil de marche réduit à 5 minutes, pénalité renforcée sur les segments vélo |

L'approche native est écartée pour deux raisons structurelles. La distribution par store est incompatible avec la contrainte d'installation sans intermédiaire. Le maintien de deux codebases dépasse la capacité d'un projet solo de 12 semaines pour un gain fonctionnel nul par rapport à une PWA (Progressive Web App, application web installable sur l'écran d'accueil depuis le navigateur, sans passer par un store applicatif).

L'approche low-code est écartée pour verrouillage éditeur et absence de contrôle des données personnelles : incompatible avec la contrainte C8 et la clause de souveraineté portée par Nantes Métropole. Elle rend également impossible l'implémentation du moteur de scoring personnalisé.

La PWA React + TypeScript est retenue. Elle satisfait les douze contraintes, repose sur des standards web ouverts et garantit un contrôle complet du bundle, de la sécurité et des données utilisateur.

### Moteur d'optimisation multicritères et non apprentissage automatique

La demande de Nantes Métropole mentionne une « IA qui optimise les trajets ». L'équipe retient un **moteur d'optimisation multicritères déterministe** plutôt qu'un modèle d'apprentissage automatique (machine learning). Ce choix repose sur trois arguments que l'équipe considère comme non négociables.

**Éco-conception (C5).** L'entraînement et l'inférence d'un modèle de machine learning génèrent une empreinte carbone significative. Proposer une solution d'aide à la mobilité durable en s'appuyant sur une technologie énergivore est en contradiction directe avec l'objet du produit.

**Explicabilité et RGPD (C8).** Un algorithme déterministe est intégralement auditable : chaque itinéraire recommandé peut être expliqué à l'usager par ses pondérations et ses facteurs (durée, CO2, confort). Le RGPD (Règlement Général sur la Protection des Données) impose la transparence sur les décisions automatisées susceptibles d'affecter les personnes. Un modèle boîte noire ne satisfait pas cette exigence.

**Disponibilité des données.** Un modèle supervisé requiert un jeu de données d'entraînement calibré sur les comportements de déplacement nantais. Ce jeu n'existe pas en open data à l'échelle nécessaire pour un MVP. L'algorithme déterministe pondéré est reproductible et fiable dès la première démonstration.

Le besoin réel derrière la formulation « IA » est une recommandation pertinente selon plusieurs critères pondérés en temps réel. C'est précisément ce que le moteur multicritères délivre, sans coût écologique ni risque réglementaire.

Une couche de personnalisation par historique (adaptation des pondérations au fil des trajets de l'usager) est envisageable en V2, explicitement hors périmètre MVP pour les raisons ci-dessus.

---

## B2. Justification de chaque choix technique

Chaque technologie retenue a été mise en regard d'au moins une alternative. Le tableau suivant documente ces arbitrages selon le triptyque besoin, options, choix retenu.

| Choix retenu | Alternative écartée | Justification |
|---|---|---|
| React 18 + TypeScript strict | Vue 3, Angular 17 | Typage statique strict réduit les erreurs à la compilation ; cohérence front/back via les types partagés dans shared/types/ ; écosystème éprouvé |
| Vite | Create React App, Webpack | Build 10 à 20 fois plus rapide, HMR (Hot Module Replacement) instantané, tree-shaking natif, bundle minimal (C5) |
| TailwindCSS v4 | CSS-in-JS (Emotion), Sass | Zéro runtime CSS, purge automatique des classes inutilisées, bundle de styles inférieur à 1 ko (C5) |
| Zustand | Redux, Context API | Légèreté (moins de 1 ko gzip), absence de boilerplate ; Redux introduit un volume de code disproportionné pour le périmètre d'un MVP solo |
| Leaflet.js + tuiles CartoDB Positron | Google Maps Platform | Leaflet pèse environ 40 ko contre plus de 200 ko pour le SDK Google Maps ; aucune carte bancaire requise ni quota d'usage ; cartographie open source (C5) |
| Recharts | Chart.js, D3.js | Composants React déclaratifs, tree-shakable, sans manipulation DOM impérative |
| Node.js + Express + TypeScript | NestJS, Fastify | Principe KISS (Keep It Simple, Stupid) : Express est suffisant pour un monolithe modulaire ; NestJS ajoute une couche de framework non justifiée par le périmètre |
| PostgreSQL + PostGIS | MongoDB, Redis seul | Requêtes géospatiales natives (calcul de distance, arrêts dans un rayon en mètres), modèle relationnel pour l'intégrité des données utilisateur et historique de trajets |
| Zod (validation des entrées) | Joi, express-validator | Inférence des types TypeScript depuis le schéma de validation : source de vérité unique, partagée entre le frontend et le backend via shared/ |
| JWT court (15 min) + refresh token cookie HttpOnly | Session serveur, token en localStorage | Stateless ; cookie HttpOnly protège contre les attaques XSS (Cross-Site Scripting) ; SameSite=Strict protège contre le CSRF (C4, C11) |
| Pattern Stratégie (TransportProvider) | Appels directs aux APIs dans routing.service | Évolutivité : ajouter un mode de transport ou un opérateur ne modifie pas le module de routing, il suffit d'implémenter l'interface TransportProvider (C9) |
| Monolithe modulaire | Microservices | Principe YAGNI (You Aren't Gonna Need It) : les microservices apportent un surcoût opérationnel injustifié pour un MVP solo. L'architecture modulaire permet d'extraire un service indépendant si le besoin de scalabilité apparaît en V2 |
| APIs publiques (Transitous, OSRM) | Auto-hébergement OTP ou OSRM | L'auto-hébergement d'un moteur de routage complet représente plusieurs jours d'infrastructure pour un gain marginal en prototype ; les APIs publiques suffisent à la démonstration |
| Vercel + Render + Supabase | VPS auto-géré (OVH, Scaleway) | CI/CD intégrée, HTTPS automatique, free tiers suffisants pour le prototype ; architecture portable via Docker si migration nécessaire |

---

## B3. Méthodologie de gestion de projet

Le projet est conduit en Scrum adapté au contexte solo. La structure Scrum classique est conservée (sprints délimités, backlog priorisé, revue à chaque fin de sprint), et les rituels non adaptables à un contexte solo sont remplacés par des équivalents fonctionnels.

### Adaptation des rituels Scrum

| Rituel Scrum classique | Adaptation solo |
|---|---|
| Daily stand-up | Journal de bord quotidien (fichier texte versionné) : blocages identifiés, décisions prises, objectif du lendemain |
| Sprint review | Démonstration autonome : parcours complet de la fonctionnalité dans le navigateur, capture ou note de validation formelle |
| Rétrospective | 30 minutes en fin de sprint : une friction identifiée, une amélioration actionnée dans le sprint suivant |
| Planning poker | Estimation par points de complexité (1, 3, 5, 8), ajustée à la charge estimée en jours |

Le backlog est géré dans un tableau Kanban (colonnes : Backlog, En cours, Revu, Terminé) accessible à l'équipe. La priorisation suit la méthode MoSCoW (Must have, Should have, Could have, Won't have) : les fonctionnalités classées "Must" constituent le périmètre MVP ; les "Won't" constituent la V2 documentée.

### Rôles portés en solo

Un projet de cette envergure mobilise des compétences habituellement réparties sur une équipe. Le tableau suivant nomme explicitement les casquettes et la répartition de charge estimée. En production réelle, ces rôles seraient distribués sur une équipe de 4 à 6 personnes.

| Rôle | Responsabilités principales | Charge estimée |
|---|---|---|
| Product Owner | Priorisation du backlog, critères d'acceptation, relation client | 10 % |
| Lead Développeur frontend | Composants React, design system, accessibilité | 30 % |
| Lead Développeur backend | API Express, routage, scoring, authentification | 30 % |
| UX/UI | Wireframes, prototype Figma, charte graphique | 10 % |
| DevOps | CI/CD GitHub Actions, déploiement Vercel / Render / Supabase | 5 % |
| QA / Référent accessibilité | Tests Vitest, audit Axe DevTools, recette manuelle | 10 % |
| Référent sécurité / RGPD | Relecture OWASP, conformité CNIL, consentement géolocalisation | 5 % |

---

## B4. Amélioration continue

La démarche DMAIC (Define, Measure, Analyze, Improve, Control) structure l'amélioration continue du projet. Elle est illustrée ici sur un cas anticipé dès l'analyse architecturale : la gestion de la latence de calcul d'itinéraire, qui conditionne directement le KPI p95 < 2 s fixé en section Contexte.

**Define.** Le planificateur multimodal doit répondre en moins de 2 secondes à p95 sur mobile. L'analyse de l'architecture de routing identifie un risque de dépassement : dans un schéma naïf, les appels aux deux providers de transport (TransitousProvider pour les transports en commun, OsrmProvider pour les modes actifs) sont séquentiels. Le temps total est alors la somme de leurs latences individuelles.

**Measure.** L'équipe prévoit de mesurer les temps de réponse sur 50 requêtes représentatives couvrant des trajets nantais variés (Doulon, Vertou, Commerce, Île de Nantes), avec horodatage côté serveur en entrée et sortie du module de routing. Les indicateurs suivis sont p50, p95 et p99. Avant optimisation, l'estimation basée sur les latences moyennes connues des APIs (Transitous : 800 ms à 1,5 s selon la complexité de la requête ; OpenWeatherMap : 300 à 600 ms) projette un p95 supérieur à 3 secondes sur des appels séquentiels.

**Analyze.** La cause racine est identifiée depuis la conception : les appels aux providers sont séquentiels alors qu'ils sont fonctionnellement indépendants. Aucun résultat d'un provider n'est nécessaire pour déclencher l'appel suivant. La dépendance séquentielle est accidentelle, pas fonctionnelle.

**Improve.** Deux mesures sont retenues. La parallélisation des appels via `Promise.all()` : TransitousProvider et OsrmProvider sont sollicités simultanément depuis routing.service, le résultat agrégé attend la complétion du plus lent. Un cache mémoire (Map JavaScript, TTL de 10 minutes) sur les données météo OpenWeatherMap élimine les appels redondants pour des requêtes portant sur le même secteur géographique dans la même fenêtre de temps. Cette combinaison cible un p50 inférieur à 800 ms et un p95 inférieur à 2 s.

**Control.** Chaque requête de calcul d'itinéraire sera horodatée côté serveur. Un seuil d'alerte est fixé à p95 > 2 s : tout dépassement constaté en recette manuelle déclenche une investigation avant le merge suivant dans la branche principale. La mesure de performance reste hors du pipeline d'intégration continue, volontairement limité au lint et au build pour rester stable sur des runners partagés, comme justifié dans la section consacrée à la qualité et aux tests.

### Kaizen continu

Au-delà du cas DMAIC, chaque sprint intègre une revue d'amélioration de 30 minutes. L'objectif est d'identifier une friction de process ou de code et d'y apporter une réponse dans le sprint suivant. Les principes DRY (Don't Repeat Yourself, ne pas dupliquer la logique) et SRP (Single Responsibility Principle, un module fait une seule chose) font l'objet d'une relecture systématique avant chaque merge. À titre d'illustration : l'extraction d'un hook `useJourneySearch` pour éliminer la duplication de logique de requête entre composants, l'ajout d'un template GitHub Issue pour standardiser les rapports de bug, ou encore l'introduction de la validation Zod en middleware plutôt qu'en controller.

---

## B5. Planning et charge

Le chiffrage détaillé en section Budget évalue la charge de réalisation à 83 jours, décomposés par rôle spécialisé (cadrage, développement frontend, développement backend, tests/accessibilité/sécurité, DevOps, gestion de projet) et valorisés au tarif d'une équipe professionnelle de 4 à 6 personnes. Porté en solo, ce chiffrage se compresse : l'absence de réunions de coordination inter-rôles, de documents de passation entre équipiers et de changement de contexte entre spécialités réduit la charge réellement consommée. Le planning solo cible 60 jours ouvrés sur 12 semaines, soit une compression d'environ 28 % par rapport au chiffrage équipe, cohérente avec le gain de productivité d'un développeur unique qui maîtrise l'ensemble de la pile applicative sans dépendance de synchronisation.

Le projet est découpé en six sprints de deux semaines (le planificateur multimodal, périmètre le plus dense, en occupe quatre), soit douze semaines de développement au total. Le rendu du dossier intervient le 20/07, à la clôture du sprint planificateur, tandis que les sprints suivants (gamification, contraintes transversales, stabilisation) poursuivent l'exécution du projet jusqu'à la démonstration de soutenance.

| Sprint | Période | Périmètre fonctionnel | Jalon |
|---|---|---|---|
| S1 | 08/06 - 21/06 | Mise en place de l'infrastructure, authentification (inscription, connexion, JWT, refresh token), modèle de données initial | Authentification fonctionnelle en local (21/06) |
| S2-S3 | 22/06 - 19/07 | Planificateur multimodal complet : TransitousProvider (bus, tramway, navibus, train), OsrmProvider (vélo, marche, scooter), moteur de scoring multicritères, filtres PMR, météo OpenWeatherMap | Scoring end-to-end fonctionnel (19/07) |
| S4 | 20/07 - 02/08 | Gamification : attribution de points par trajet, badges, tableau de bord citoyen, historique de trajets, boutique de récompenses | Parcours gamification et récompenses complet (02/08) |
| S5 | 03/08 - 16/08 | Contraintes transversales : accessibilité WCAG 2.1 AA, éco-conception (bundle, lazy loading), sécurité OWASP, RGPD (consentement géolocalisation, suppression du compte) | Audit Axe DevTools : 0 erreur bloquante (16/08) |
| S6 | 17/08 - 30/08 | Stabilisation, mode démo (bascule DEMO_MODE), couverture de tests Vitest, documentation Swagger / OpenAPI, recette finale | Prototype complet, prêt pour la démonstration (30/08) |

Le rendu du dossier, le 20/07, précède donc les preuves qu'il annonce pour les contraintes transversales (audit Axe DevTools, rapport Lighthouse, couverture Vitest, rapport de bundle) : ces captures sont insérées dans une révision du dossier une fois les sprints S5 et S6 clôturés, avant la soutenance de septembre.

> _Diagramme de Gantt : voir [B5-gantt.md](B5-gantt.md)_

---

## B6. Budget et chiffrage

### Coût de réalisation

Le chiffrage est établi selon la méthode charge estimée multipliée par le TJM (taux journalier moyen) de marché pour un profil développeur full-stack senior en région Pays-de-la-Loire (source : grille salariale APEC 2024). Il permet à Nantes Métropole d'évaluer le coût de reconduction ou d'extension du projet avec une équipe professionnelle.

| Poste | Charge estimée | TJM indicatif | Coût estimé |
|---|---|---|---|
| Cadrage, conception, UX/UI | 10 j | 450 EUR | 4 500 EUR |
| Développement frontend (React, composants, design system) | 25 j | 500 EUR | 12 500 EUR |
| Développement backend (API, routing, scoring, authentification) | 25 j | 500 EUR | 12 500 EUR |
| Tests, accessibilité, sécurité | 10 j | 450 EUR | 4 500 EUR |
| DevOps et déploiement (CI/CD, environnements) | 5 j | 500 EUR | 2 500 EUR |
| Gestion de projet et documentation | 8 j | 450 EUR | 3 600 EUR |
| **Total réalisation** | **83 j** | | **40 100 EUR** |

Ces TJM sont indicatifs. Le projet est conduit dans un cadre pédagogique par un seul développeur ; ce tableau matérialise la valeur marchande du travail proposé et constitue la base d'un chiffrage réaliste pour une reconduction en contexte professionnel.

### Coût de fonctionnement annuel

Le TCO (Total Cost of Ownership, coût total de possession sur un an) couvre les charges récurrentes nécessaires à l'exploitation de la solution en production réelle, au-delà du prototype.

| Poste | Coût annuel estimé |
|---|---|
| Hébergement (Vercel, Render, Supabase, tiers payants en production) | 600 à 1 500 EUR |
| APIs externes (OpenWeatherMap, quota production) | 200 à 600 EUR selon volume d'usage |
| Nom de domaine et certificats TLS | 50 EUR |
| Maintenance corrective et évolutive (2 jours par mois minimum) | 12 000 EUR |
| **TCO annuel indicatif** | **12 850 à 14 150 EUR** |

### Modèle économique

UrbanFlow est un service public numérique : gratuit pour le citoyen, financé par la collectivité. Trois leviers de financement sont identifiés.

Subventions fléchées transition écologique. L'ADEME (Agence de la transition écologique) et le programme Fonds Vert de l'État financent les projets de mobilité durable des collectivités. UrbanFlow répond aux critères d'éligibilité (réduction de l'empreinte carbone des déplacements, intermodalité, données ouvertes).

Mutualisation inter-collectivités. Le code source produit est réutilisable pour d'autres métropoles françaises disposant d'un réseau de transport comparable et d'un flux GTFS ouvert. Une mise en commun des coûts de maintenance réduit le TCO par collectivité.

ROI non monétaire. Le retour sur investissement d'un service public de mobilité ne se mesure pas en chiffre d'affaires. Il se mesure en externalités positives quantifiables : tonnes de CO2 évitées par report modal, réduction de la congestion aux points de comptage, données d'aide à la décision pour les politiques de mobilité. Ces indicateurs, définis en section A5, sont calculables dès le déploiement en production et constituent le rapport d'impact que Nantes Métropole peut présenter aux institutions financeuses et à ses administrés.
