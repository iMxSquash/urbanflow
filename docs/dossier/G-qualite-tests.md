# Phase G : Qualité, tests et gestion des bogues

---

## G1. Stratégie de tests

Le moteur de scoring multicritères est un algorithme déterministe : toute modification des pondérations ou des filtres PMR peut produire un résultat incorrect sans déclencher d'erreur runtime. Les tests unitaires sont la seule protection contre cette catégorie de bogues silencieux. L'équipe retient une stratégie en trois niveaux : tests unitaires sur la logique métier, tests d'intégration sur les endpoints Express, et recette manuelle sur le prototype complet.

### Tests unitaires avec Vitest

Vitest est retenu face à Jest pour trois raisons : support natif des modules ES (ECMAScript Modules) sans transpilation supplémentaire, intégration TypeScript sans configuration Babel, et performances supérieures sur les suites courtes grâce au worker pool Vite. L'API est compatible Jest ; une migration éventuelle ne représente pas de charge de réécriture.

Le périmètre des tests unitaires couvre les modules à logique calculatoire pure, là où une erreur de logique ne produit pas de crash mais un résultat incorrect.

| Module | Cas couverts |
|---|---|
| `scoring.service.ts` | Score final par pondération eco / rapide / équilibré ; pénalités PMR (seuil 5 min, pénalité vélo) ; calcul CO2 par segment (facteurs Base Empreinte ADEME) ; valeurs limites (score à 0, distance nulle, itinéraire mono-mode) |
| `selectProviders()` dans `routing.service.ts` | Sélection de `TransitousProvider` sur mode TC ; `OsrmProvider` sur mode actif ; `DemoProvider` sur `DEMO_MODE=true` ; combinaison de modes |
| `OsrmProvider` | Refus de construction d'un trajet Bicloo si la station la plus proche dépasse 1,5 km de marche |
| Constantes CO2 | Vérification que les valeurs correspondent aux coefficients ADEME déclarés dans `shared/constants/co2-factors.ts` |

### Tests d'intégration

Les endpoints Express sont testés via Supertest (bibliothèque de test HTTP pour Node.js qui exécute les requêtes sans démarrer de serveur réseau réel) avec la variable `DEMO_MODE=true` active. Ce mode bascule tous les appels aux APIs externes vers les fichiers JSON statiques de `demo-data/`, rendant les tests d'intégration reproductibles sans dépendance réseau ni clé API.

| Endpoint | Cas couverts |
|---|---|
| `POST /api/auth/register` | Inscription valide (201) ; email déjà utilisé (409) ; payload invalide (400 Zod) |
| `POST /api/auth/login` | Connexion valide (200 + cookie refresh) ; mauvais mot de passe (401) ; payload invalide (400) |
| `POST /api/routing/journeys` | Calcul nominal (200, liste non vide) ; payload sans coordonnées (400) ; token manquant (401) |
| `GET /api/journeys/history` | Historique avec JWT valide (200) ; sans JWT (401) |
| `DELETE /api/users/me` | Suppression en cascade (204) ; vérification que le compte n'est plus accessible (404 sur requête suivante) |

### Ce qui n'est pas automatisé en intégration continue

Deux catégories de tests restent manuels et hors du pipeline GitHub Actions.

L'audit d'accessibilité Axe DevTools est exécuté manuellement sur les cinq écrans du parcours principal avant chaque merge significatif. L'automatisation dans la CI produirait des résultats instables : JSDOM (DOM virtuel, environnement JavaScript simulé sans navigateur réel) ne reproduit pas fidèlement le rendu CSS et les interactions ARIA d'un navigateur. La procédure manuelle, détaillée dans la section consacrée à la contrainte C7, reste la référence pour l'audit de conformité WCAG.

L'audit Lighthouse est exclu de la CI GitHub Actions. Les runners partagés GitHub produisent des résultats de performance inconsistants (variance de 15 à 20 points sur des runs identiques) liée aux différences de charge CPU entre les machines virtuelles. Lighthouse est exécuté depuis Chrome DevTools en local, sur réseau simulé 4G lente et CPU x4, et le rapport est capturé comme preuve annexe.

**Résultat de la suite au dernier run (`npm run test:coverage`)** : 25 fichiers de test, 444 tests, tous passants. La couverture v8 s'établit à 82,8 % des instructions et 83,4 % des fonctions sur l'ensemble du code serveur, avec une couverture proche de 100 % sur les modules à logique métier critique (`rewards.service.ts` : 100 %, `auth.service.ts` : 95,9 %, `gamification.service.ts` : 87,4 %). Le module `demo-config.ts` reste sous-couvert (39 %) : il s'agit de configuration de scénarios de démonstration, à faible risque de régression fonctionnelle.

> **[À CRÉER]** _Capture d'écran_ : rapport de couverture Vitest dans le terminal après `npm run test:coverage`, à jour au moment du rendu (les chiffres ci-dessus datent de la dernière vérification et évolueront avec le code).

---

## G2. Workflow de gestion des bogues en préproduction

La préproduction correspond à l'environnement de déploiement continu activé dès le sprint 2 : branche `main` déployée automatiquement sur Vercel (frontend) et Render (backend) à chaque merge. Tout bogue identifié dans cet environnement suit un processus structuré.

### Signalement et triage

Les bogues sont signalés via GitHub Issues avec un template de rapport imposant quatre champs : description du comportement observé, comportement attendu, étapes de reproduction, environnement (navigateur, système d'exploitation, type de réseau) et capture d'écran si applicable. Ce format standardisé réduit le délai de diagnostic en évitant les rapports incomplets qui nécessitent des allers-retours.

À l'ouverture, chaque issue reçoit un label de criticité parmi trois niveaux.

| Criticité | Définition | Délai cible |
|---|---|---|
| Bloquant | Fonctionnalité du périmètre MVP inutilisable, faille de sécurité, crash applicatif non récupéré | Correction avant tout merge suivant |
| Majeur | Résultat incorrect sans crash, dégradation UX significative, test d'intégration en échec | Traitement dans le sprint courant |
| Mineur | Problème visuel sans impact fonctionnel, libellé incorrect, incohérence de style | Backlog, traitement si la capacité du sprint le permet |

### Cycle de correction

Un bogue bloquant ou majeur déclenche l'ouverture d'une branche `fix/nom-du-bug` depuis `main`. La correction est développée sur cette branche et couverte par au moins un test qui reproduit le comportement fautif avant de valider le comportement corrigé. Si le bogue ne peut pas être couvert par un test automatisé (par exemple un problème de rendu CSS), la recette manuelle est documentée dans la pull request.

La pull request cible `main` directement. Elle décrit le comportement fautif, la cause racine identifiée et la mesure corrective. Le pipeline CI (lint + build TypeScript) doit passer sans avertissement. Après merge, la correction est vérifiée dans l'environnement de préproduction avant fermeture de l'issue.

> **[À CRÉER]** _Capture d'écran_ : vue du tableau GitHub Issues filtré par label "bug" montrant au moins un exemple de rapport complet (template rempli, label de criticité visible, statut ouvert ou fermé). À prendre depuis l'interface GitHub après création des labels et du template.

### Définition de terminé pour un bogue

Un bogue est considéré terminé quand les quatre conditions suivantes sont réunies : la correction est présente dans `main` ; au moins un test automatisé reproduit puis valide le comportement attendu (ou la recette manuelle est documentée dans la PR) ; le pipeline CI est au vert ; la vérification en préproduction confirme l'absence de régression sur les écrans adjacents.

---

## G3. Philosophie de correction

La règle qui gouverne la correction des bogues dans ce projet est la suivante : toute correction identifie et supprime la cause racine. Un contournement n'est jamais une correction.

Cette distinction a des conséquences concrètes sur la qualité du code. Dans le planificateur multimodal, le composant de recherche d'itinéraire peut déclencher un double appel API à chaque montage : c'est le comportement attendu de React 18 en mode strict (Strict Mode), qui simule le cycle montage-démontage-remontage précisément pour exposer les effets de bord non nettoyés. La réponse instinctive serait d'introduire un flag booléen déclaré en dehors du composant pour bloquer le second appel. Cette approche résout le symptôme visible mais masque la cause réelle, introduit un état global non prévisible et crée de la dette technique.

La correction retenue utilise `AbortController` (interface Web standard permettant d'annuler une requête en cours) et la fonction de nettoyage du `useEffect` : le premier appel est annulé proprement par le `cleanup` avant que le second se déclenche. Le composant gère son propre cycle de vie sans dépendre d'un état externe. La correction améliore la robustesse dans tous les contextes, pas seulement en mode strict.

Ce principe s'étend à l'ensemble de la base de code. Un `eslint-disable` ciblé masque une erreur de type sans la corriger. Une annotation `any` contourne le système de types sans résoudre l'ambiguité sous-jacente. Un bloc `try/catch` vide avale silencieusement une exception. Aucune de ces pratiques n'est acceptée dans le workflow de revue. Si une correction introduit un contournement, la pull request est renvoyée avec une demande d'investigation de la cause racine.

Cette exigence est documentée dans les critères de revue de pull request et s'applique indépendamment de la criticité du bogue. Elle est l'un des indicateurs de maturité d'ingénierie que le jury de titre évalue lors de la soutenance.

---

## G4. Mode démo comme filet de sécurité

Le mode démo (`DEMO_MODE=true`) est le filet de sécurité de la démonstration de soutenance et de la phase de recette en préproduction. Quand cette variable est active, l'ensemble des appels aux APIs externes (Transitous, OSRM, OpenWeatherMap, GBFS Bicloo) est remplacé par des réponses JSON statiques préchargées dans `demo-data/`.

Les fichiers de démo couvrent deux scénarios de mobilité représentatifs du réseau nantais : un trajet par temps ensoleillé, où le scoring favorise les modes actifs (vélo, marche), et un trajet par temps pluvieux, où le scoring favorise les transports en commun couverts. Ces deux scénarios permettent de démontrer en conditions maîtrisées le comportement différentiel du moteur de scoring selon la météo, sans aucune dépendance réseau.

Ce dispositif répond à deux besoins simultanés. Il isole les tests d'intégration de toute indisponibilité d'une API tierce pendant le développement. Il garantit que la démonstration reste fonctionnelle même si Transitous ou OSRM, hébergés sur des infrastructures publiques tierces, sont temporairement indisponibles le jour de la soutenance.

Le mode démo n'est pas un prototype simplifié : il exécute exactement les mêmes chemins de code que le mode production. La seule différence est la source des données. Ce qui est démontré en mode démo est fonctionnellement identique à ce qui serait déployé en production avec de vraies APIs, et les tests d'intégration exécutés avec `DEMO_MODE=true` valident par extension le comportement du code de production.
