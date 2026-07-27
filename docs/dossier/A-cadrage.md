# Phase A : Contexte et objectifs du projet

---

## A1. Reformulation du besoin client

Nantes Métropole, collectivité de 500 000 habitants portant une politique active de transition écologique, souhaite réduire la dépendance à l'automobile en offrant à ses citoyens une alternative numérique unifiée, accessible et engageante. L'email de Claire Hénette liste neuf fonctionnalités. L'équipe les a classées selon leur faisabilité dans le périmètre d'un MVP solo livrable en 12 semaines.

**Fonctionnalités retenues au MVP (périmètre proposé)**

| Fonctionnalité demandée | Interprétation produit |
|---|---|
| Planificateur multimodal intelligent | Calcul d'itinéraires combinant bus, tramway, train, vélo, marche, scooter électrique, navibus |
| "IA" d'optimisation (trafic, météo, préférences) | Moteur d'optimisation multicritères déterministe (durée, CO2, confort) pondéré par profil utilisateur. La météo temps réel (OpenWeatherMap, cache 10 min) est intégrée dans le score de confort. Ce choix est justifié dans la section Pilotage. |
| Gamification avec récompenses | Points par trajet éco-responsable, badges, boutique de récompenses échangeables auprès de partenaires locaux (Bicloo, Naolib, sites culturels nantais) |
| Calcul et suivi empreinte carbone | Score CO2 par trajet, facteurs ADEME, économie vs voiture |
| Tableau de bord citoyen | Historique de trajets, statistiques de mobilité, progression gamification |

**Fonctionnalités reportées en V2 (hors périmètre MVP)**

| Fonctionnalité | Raison du report |
|---|---|
| Réservation unifiée (vélos, parkings, covoiturage) | Nécessite des contrats partenaires et des APIs de paiement : périmètre commercial, hors MVP académique |
| Plateforme de covoiturage dynamique | Fonctionnalité de mise en relation : complexité RGPD et sécurité supplémentaire, périmètre distinct |
| Alertes/notifications temps réel (SIRI) | L'interface SIRI-Lite Naolib est identifiée et documentée ; l'intégration complète est planifiée en V2 |
| Signalement collaboratif voirie | Fonctionnalité civique à fort potentiel mais sans impact sur le MVP transport ; périmètre isolé |

**Besoins implicites identifiés, non formulés dans l'email**

Trois besoins transversaux émergent de l'analyse du contexte, sans figurer explicitement dans la demande.

*Fiabilité en mobilité contrainte.* Un citoyen en déplacement dispose d'une connexion réseau variable. Le cas type : l'usager planifie son trajet en ligne, puis perd le réseau dans un tunnel de tramway et doit pouvoir reconsulter les étapes et la carte de l'itinéraire déjà calculé. La solution répond par une stratégie hors ligne côté client (service worker pour l'app shell et les tuiles consultées, persistance des derniers itinéraires et de l'état utilisateur en IndexedDB). Le calcul d'un nouvel itinéraire reste dépendant des APIs de routage : il est hors périmètre hors ligne en MVP, et documenté comme tel. Cette stratégie est distincte du mode démo interne (variable `DEMO_MODE=true`, bascule le backend sur des fichiers JSON statiques), qui est un filet de sécurité de développement et de soutenance, jamais activé pour l'usager final.

*Confiance dans le traitement des données GPS.* Les données de déplacement sont des données personnelles sensibles. L'utilisateur doit consentir explicitement à la géolocalisation et disposer d'un droit d'effacement effectif. Ce besoin implicite conditionne l'adoption.

*Inclusion : PMR et fracture numérique.* Nantes Métropole porte une politique d'accessibilité universelle. La solution doit filtrer les itinéraires selon les capacités de l'utilisateur (mobilité réduite) et rester utilisable sans smartphone haut de gamme (bundle léger, chargement rapide sur réseau 3G).

---

## A2. Parties prenantes

La matrice ci-dessous classe les acteurs selon leur pouvoir de décision sur le projet et leur intérêt dans son succès.

| Acteur | Pouvoir | Intérêt | Nature de l'engagement |
|---|---|---|---|
| Nantes Métropole (Claire Hénette) | Élevé | Élevé | Commanditaire, financeur, valideur des livrables |
| Citoyens-usagers | Faible | Élevé | Utilisateurs finaux : leur adoption est le KPI politique central |
| Semitan/Naolib | Moyen | Élevé | Opérateur du réseau Naolib, fournisseur de données TC (GTFS, SIRI) |
| Opérateurs mobilité douce (Bicloo, trottinettes) | Faible | Moyen | Fournisseurs de données GBFS (General Bikeshare Feed Specification) ; aucun contrat direct au MVP |
| Direction voirie Nantes Métropole | Faible | Faible | Destinataire des signalements collaboratifs V2 ; sans impact sur le MVP |
| CNIL | Élevé | Faible | Autorité de contrôle RGPD ; pouvoir sanction élevé, engagement indirect (conformité à maintenir) |

![Matrice pouvoir/intérêt](exports/A2-matrice-pouvoir-interet.png)
> _Source et description : [A2-matrice-pouvoir-interet.md](A2-matrice-pouvoir-interet.md)_

**Acteur décisif pour la réussite opérationnelle : Semitan/Naolib.** L'accès aux données temps réel (prochains passages, perturbations) conditionne la qualité perçue de la solution. Le MVP s'appuie sur les données ouvertes disponibles (GTFS statique via Transitous, GBFS Bicloo). L'intégration SIRI-Lite en temps réel est documentée comme livrable V2, conditionnée à un accord opérationnel avec Semitan.

---

## A3. Étude concurrentielle

Quatre solutions sont présentes sur le marché ou utilisées par les citoyens nantais. Le tableau suivant les positionne face à UrbanFlow.

| Solution | Forces | Limites | Différence UrbanFlow |
|---|---|---|---|
| Google Maps | Couverture mondiale, notoriété, temps réel | Données revendues à des tiers, pas de scoring CO2 sur facteurs ADEME locaux, pas de gamification, carte bancaire pour les APIs | Souveraineté des données, ancrage territorial Nantes, éco-scoring sourcé ADEME, gamification |
| Citymapper | UX multimodale soignée, mis à jour en temps réel, intègre les vélos en libre-service dans les villes couvertes | Ne couvre pas Nantes, disponible dans un nombre restreint de métropoles mondiales ; modèle propriétaire fermé ; pas de scoring CO2 sourcé sur des facteurs ADEME | Couverture native du territoire nantais, open data, sans dépendance à un éditeur tiers |
| Moovit | Base de données TC très riche, couverture mondiale, contributions communautaires, propose aussi des itinéraires vélo et marche dans plusieurs villes | Pas de calcul d'empreinte carbone sourcé sur des facteurs ADEME locaux, pas de gamification, modèle de données propriétaire fermé | Éco-scoring ADEME, gamification incitative, ancrage territorial Nantes |
| Application officielle Naolib (Semitan) | Source de données officielle, en temps réel sur le réseau Naolib | Mono-mode (transports en commun uniquement), pas multimodal, pas d'éco-scoring | Multimodalité complète, score CO2, profil de préférences utilisateur |

**Proposition de valeur unique.** Aucune solution existante ne combine les quatre axes suivants sur le territoire nantais : multimodalité complète (TC + modes actifs + Bicloo), éco-scoring sourcé sur les facteurs ADEME, gamification incitative à la mobilité durable, et souveraineté des données (hébergement européen, données GPS non revendues).

---

## A4. Personas

Deux personas représentent la cible de cœur du produit. Ils sont construits depuis l'analyse du besoin client et du contexte territorial nantais. La question d'accessibilité PMR (personnes à mobilité réduite), transversale à l'ensemble de la solution, est traitée dans la section dédiée à l'accessibilité plutôt qu'en persona distinct : elle conditionne des choix de conception, pas un segment d'acquisition.

---

### Léa, 27 ans, cible primaire

**Profil.** Chargée de communication, quartier Doulon (est de Nantes), bureau sur l'île de Nantes. Pendulaire quotidienne, vélo en été, tramway ligne 1 quand il pleut. À l'aise avec les apps mobiles.

**Job-to-be-done.** Rejoindre son bureau à l'heure sans avoir à arbitrer chaque matin entre ses options de transport : l'information doit venir à elle, pas l'inverse.

**Points de friction (par sévérité)**
1. Elle ignore si le vélo est pertinent ce matin-là : météo, vent, heure de pointe. Résultat : elle prend la décision par défaut (tram) même quand le vélo serait plus rapide. Sévère, quotidien.
2. Comparer tramway, vélo et Bicloo exige de jongler entre trois apps différentes. Friction quotidienne à chaque départ.
3. Elle ne voit pas l'impact concret de ses choix de mobilité et ne sait pas si ses efforts comptent. Faible, mais frein à la fidélité long terme.

**Gains attendus**
1. Une recommandation contextualisée (météo + heure) en moins de 10 secondes, sans saisie complexe.
2. La certitude d'arriver à l'heure : aucun retard lié à un mauvais choix de mode.
3. Une progression visible de son impact CO2, consultable quand elle le souhaite.

**Insight inattendu.** Léa n'est pas motivée par l'écologie en premier lieu. Elle adopte la mobilité douce par confort et gain de temps, pas par conviction environnementale : l'éco-scoring et la gamification ne sont pas ce qui la fait basculer vers un nouveau mode de transport, elle l'a déjà fait. Leur rôle produit n'est donc pas la conversion mais la rétention : ce qui la fait revenir consulter l'application une fois son trajet du jour trouvé, c'est la visibilité de ce qu'elle accomplit déjà. Conséquence produit : le score CO2 et la progression de gamification restent présents mais jamais en avant-plan du parcours de calcul d'itinéraire ; ils trouvent leur place dans le tableau de bord, consulté par choix et non imposé à chaque recherche.

**Adéquation produit.** Le planificateur multimodal avec profil "rapide" et météo intégrée répond directement à son job de rejoindre son bureau à l'heure. La gamification (points, badges, boutique de récompenses) et le tableau de bord de mobilité tiennent leur place au périmètre MVP grâce à ce même persona : sans mécanisme de visibilité de la progression, rien ne la ramène vers l'application une fois l'itinéraire du jour trouvé. C'est Léa qui porte, en rétention plutôt qu'en acquisition, les fonctionnalités qui différencient le MVP au-delà du planificateur multimodal seul. Friction principale identifiée : si le temps de calcul dépasse 2-3 secondes le matin, elle quitte l'app.

---

### Marc, 54 ans, cible secondaire

**Profil.** Technicien de maintenance, Vertou (commune limitrophe au sud de Nantes). Vient en voiture jusqu'au parking de la station de tramway Vertou chaque matin, prend le tram jusqu'au centre. N'a jamais envisagé d'alternative à cette routine.

**Job-to-be-done.** Maintenir la fiabilité de son trajet domicile-travail sans effort supplémentaire, tout en répondant à la pression économique et sociale de réduire l'usage de la voiture.

**Points de friction (par sévérité)**
1. Il ne fait pas confiance aux apps de transport : "ça ne connaît pas mon trajet". Barrière psychologique d'entrée, sévère.
2. Il n'a pas imaginé le park-and-ride comme alternative structurée : pour lui, soit c'est voiture complète, soit c'est tram depuis Vertou centre. La combinaison n'existe pas dans sa représentation mentale. Sévère.
3. Il ne dispose d'aucun argument économique chiffré pour justifier un changement d'habitude. Sans ce chiffre, l'effort perçu dépasse le bénéfice perçu. Moyen.

**Gains attendus**
1. Un itinéraire qui ne soit pas plus compliqué que sa routine actuelle : une correspondance maximum.
2. Un calcul d'économie mensuelle concret (coût voiture vs TC + parking P+R).
3. La preuve que l'alternative est fiable : aucune mauvaise surprise non anticipée.

**Insight inattendu.** Marc n'a pas besoin d'être convaincu par l'écologie. L'argument CO2 ne l'atteint pas en point d'entrée et peut même générer un rejet ("encore un truc pour les bobos"). Ce qui le convainc, c'est la simplicité du parcours et l'argument économique chiffré. Conséquence produit : pour ce profil, le score CO2 apparaît en second plan, après la durée et l'économie financière. L'interface doit être réduite à l'essentiel : toute complexité visible le fait décrocher.

**Adéquation produit.** Le profil "balanced", la mixité des modes (voiture partielle + TC) et l'affichage de l'économie CO2 vs voiture répondent à ses gains. Friction principale identifiée : l'interface doit rester aussi simple qu'un plan de métro. Toute option avancée visible sans qu'il l'ait demandée est un obstacle.

---

## A5. KPIs de succès

Les indicateurs suivants constituent le référentiel d'acceptation du MVP. Ils sont vérifiables par des outils ou des métriques objectives.

**Performance technique**

| Indicateur | Cible | Méthode de mesure |
|---|---|---|
| Temps de réponse itinéraire (p95) | < 2 s | Logs Express (timestamp requête/réponse) |
| Temps de réponse itinéraire (p50) | < 800 ms | Idem |
| Score Lighthouse Performance | > 90 | Audit Lighthouse DevTools |
| Bundle frontend compressé (gzip) | < 300 ko | Rapport Vite build + vite-bundle-visualizer |

**Accessibilité et qualité**

| Indicateur | Cible | Méthode de mesure |
|---|---|---|
| Erreurs bloquantes Axe DevTools | 0 | Audit Axe manuel sur les 5 écrans principaux |
| Ratio de contraste (texte normal) | >= 4.5:1 | Axe + vérification palette UrbanFlow |
| Navigation clavier complète | Toutes les fonctionnalités atteignables | Test manuel |

**Couverture fonctionnelle**

| Indicateur | Cible |
|---|---|
| Fonctionnalités incluses au périmètre MVP | Authentification, planificateur multimodal, gamification et boutique de récompenses, tableau de bord citoyen |
| Consultation hors ligne (usager) | App shell, derniers itinéraires calculés et tuiles consultées disponibles sans réseau (service worker PWA + IndexedDB) |

**Impact métier (projection, non mesurable en MVP)**

Ces indicateurs sont des projections destinées à la collectivité. Ils fondent le ROI non monétaire du projet.

- Taux de trajets reportés vers les modes doux (objectif Nantes Métropole : +15% d'ici 2030).
- Économie CO2 moyenne par usager actif par mois (calculée depuis les facteurs ADEME et l'historique de trajets).
- Nombre de trajets voiture évités (dérivé du report modal mesuré).

Ces trois métriques sont calculables dès que la solution est déployée en production et que la base d'utilisateurs est suffisante pour être statistiquement significative. Leur définition dès le MVP permet de préparer les tableaux de bord opérationnels V2 sans refactoring du modèle de données.
