# Phase H : Risques, perspectives et conclusion

---

## H1. Registre de risques

Six risques ont été identifiés et évalués selon deux axes : probabilité d'occurrence sur la durée du projet et impact sur la livraison du MVP. La valeur "Avérée" désigne un risque dont la réalisation est certaine (contrainte connue et documentée), et non une probabilité estimée.

| Risque | Probabilité | Impact | Mitigation |
|---|---|---|---|
| Indisponibilité d'une API externe (Transitous ou OSRM) | Moyenne | Élevé | Mode démo (`DEMO_MODE=true`), timeout individuel de 5 s par provider, fallback JSON statiques |
| OSRM public limité au profil routier, sans profil cyclable | Avérée | Moyen | Distance géométrique OSRM + durée calculée par vitesse constante par mode (15 km/h vélo, 5 km/h marche, 20 km/h scooter) |
| Données temps réel SIRI absentes en V1 | Avérée | Faible | Horaires théoriques GTFS via Transitous ; intégration SIRI-Lite documentée et réservée à la V2 |
| Montée en charge dépassant la capacité du monolithe | Faible | Moyen | Architecture modulaire : les modules de routage et de gamification sont découplés et extractibles en services indépendants si le besoin émerge |
| Non-conformité RGPD sur la géolocalisation | Moyenne | Élevé | Consentement explicite avant toute activation, minimisation des données transmises, endpoint `DELETE /api/users/me` actif, rétention bornée à 12 mois |
| Dépendance aux tiers gratuits d'hébergement | Moyenne | Moyen | Architecture conteneurisée, aucun appel à des APIs propriétaires de plateforme : migration vers un hébergement souverain sans réécriture applicative |

![Matrice de risques](exports/H1-matrice-risques.png)
> _Source et description : [H1-matrice-risques.md](H1-matrice-risques.md)_

### Profil vélo OSRM

OSRM (Open Source Routing Machine, moteur de calcul d'itinéraires open source) ne propose, sur son API publique, qu'un profil de routage automobile. Cette limitation est avérée et connue avant le démarrage du développement.

La mitigation retenue dissocie la géométrie du calcul de durée. OSRM fournit la forme réelle du trajet et la distance exacte. La durée est calculée côté serveur à partir d'une vitesse constante propre à chaque mode. Cette approximation est suffisante pour le moteur de scoring multicritères et pour la démonstration sur le réseau nantais. Un garde-fou complémentaire est inclus dans le provider de routage actif : si la station Bicloo la plus proche dépasse 1,5 km de marche, l'itinéraire n'est pas construit, ce qui évite de proposer des segments de marche disproportionnés que le scoring éliminerait de toute façon.

L'auto-hébergement d'une instance OSRM configurée avec un profil cyclable est prévu en V2, où il remplacera cette approximation sans aucun impact sur le reste de la solution.

### Indisponibilité des APIs externes

Transitous et OSRM sont des services publics sans engagement de disponibilité contractuelle (SLA, Service Level Agreement). Leur indisponibilité lors d'une recette ou d'une démonstration est un scénario crédible et anticipé.

Le mode démo répond directement à ce risque. Lorsque la variable `DEMO_MODE` est active, tous les appels externes sont remplacés par des réponses JSON statiques couvrant deux scénarios représentatifs du réseau nantais : un trajet par temps ensoleillé et un trajet par temps pluvieux. Le moteur de scoring et l'ensemble du code de traitement restent identiques à la version production. Ce qui est démontré en mode démo est fonctionnellement équivalent à ce qui serait déployé avec de vraies APIs. Ce dispositif est décrit en détail dans la section Qualité, tests et gestion des bogues.

---

## H2. Perspectives d'évolution

Les éléments suivants ne sont pas au périmètre du MVP. Ils sont identifiés dès la conception pour garantir que l'architecture retenue ne crée pas d'obstacles à leur intégration future.

**Temps réel et données de perturbations (V2).** L'interface SIRI-Lite (Service Interface for Real-time Information) de Naolib permettra d'afficher les prochains passages et les perturbations en temps réel. Le pattern Stratégie (TransportProvider, interface d'abstraction des fournisseurs de transport) est conçu pour absorber ce fournisseur additionnel sans modification du module de routage ni du moteur de scoring.

**Routage auto-hébergé (V2).** L'auto-hébergement d'une instance OSRM avec profil cyclable, combiné à un serveur OTP (OpenTripPlanner, moteur de planification multimodale open source), améliorera la précision des durées en modes actifs et l'accès à des données TC locales plus riches. Le remplacement des providers est transparent pour le reste de la solution.

**Réservation et paiement unifié (V2+).** La réservation de vélos Bicloo, de places P+R (Park and Ride, stationnement de transit) et l'achat de titres TC depuis la solution nécessitent des contrats partenaires avec Semitan et les opérateurs de mobilité douce. Ce périmètre est reporté pour des raisons commerciales et réglementaires, non techniques.

**Extension multi-collectivités (V2+).** L'architecture découplée et la couche d'abstraction TransportProvider permettent de déployer la solution sur une autre métropole en remplaçant uniquement les fournisseurs de données. Ce levier de mutualisation entre collectivités constitue un argument de ROI (retour sur investissement) pour Nantes Métropole : le code produit dans le cadre de ce projet est directement réutilisable sur d'autres territoires.

**Personnalisation par l'historique (V2+).** Une couche d'adaptation des pondérations du moteur multicritères à partir de l'historique de trajets de l'usager est envisageable. Elle est réservée à la V2 pour les raisons d'éco-conception et de conformité RGPD justifiées dans la section Pilotage.

---

## H3. Conclusion

UrbanFlow propose à Nantes Métropole une solution construite sur des choix d'ingénierie assumés : une PWA (Progressive Web App) installable sans store, un moteur d'optimisation multicritères déterministe et auditable, une architecture ouverte fondée sur des standards transport reconnus, et un hébergement souverain des données de déplacement citoyennes.

Chaque contrainte du cahier des charges est couverte, tracée et associée à une preuve vérifiable. Les concessions du MVP sont documentées et motivées : absence de données temps réel SIRI, durées en modes actifs calculées par approximation de vitesse, fonctionnalités de réservation reportées en V2. Aucune de ces concessions ne compromet la démonstration du cas d'usage central : le calcul et la comparaison d'itinéraires multimodaux entre deux points du réseau nantais, avec prise en compte des préférences utilisateur, de l'accessibilité PMR et de l'empreinte carbone par segment.

Le ROI proposé à la collectivité est non monétaire. Il se mesure en kilomètres de modes doux substitués à la voiture, en kilogrammes de CO2 évités par usager actif, et en données agrégées d'aide à la décision publique sur les flux de mobilité. Ces métriques sont calculables dès le déploiement en production depuis les données déjà collectées par la solution, sans évolution du modèle de données.

La réutilisabilité de l'architecture sur d'autres collectivités renforce la proposition de valeur au-delà du seul territoire nantais. Nantes Métropole investit dans un bien commun numérique, pas dans un produit à usage unique.
