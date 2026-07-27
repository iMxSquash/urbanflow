# Phase C : Diagrammes UML

Trois diagrammes UML (Unified Modeling Language, langage de modélisation unifié) structurent la représentation de la solution. Le diagramme de cas d'utilisation délimite le périmètre fonctionnel et identifie les acteurs. Le diagramme de séquences détaille le flux de calcul d'itinéraire, du geste utilisateur à la réponse triée. Le diagramme de communication représente les mêmes échanges depuis une perspective structurelle, en mettant en avant les collaborations entre objets plutôt que leur chronologie.

---

## C1. Diagramme de cas d'utilisation

Le diagramme implique trois acteurs et délimite le périmètre fonctionnel retenu pour le MVP.

Le Citoyen est l'acteur principal. Il s'inscrit, se connecte, saisit un itinéraire, sélectionne un profil de préférence parmi trois options (eco, rapide, équilibré) et consulte les résultats triés par score multicritères. Il accède à son tableau de bord, qui regroupe trois cas distincts : consultation de l'historique de trajets, consultation du score CO2 cumulé, et consultation des badges et points acquis via la gamification. Il peut également échanger les points accumulés contre une récompense du catalogue proposé par des partenaires locaux (Bicloo, Naolib, sites culturels nantais) : ce cas débite son solde de points et génère un code d'échange unique. Le cas "Supprimer son compte" est directement accessible à tout citoyen authentifié, en application du droit à l'effacement prévu par le RGPD.

Le Citoyen-PMR (personnes à mobilité réduite) est une spécialisation du Citoyen par relation de généralisation. Il hérite de l'ensemble de ses cas d'utilisation et en ajoute un seul : "Activer le filtre PMR". Ce filtre modifie le comportement du moteur de scoring, en réduisant le seuil de marche toléré à cinq minutes et en appliquant une pénalité sur les segments vélo.

L'Administrateur est un acteur interne. Son seul cas dans le périmètre MVP est la gestion des comptes utilisateurs ; il n'accède à aucune donnée de déplacement individuelle.

Deux relations structurent le diagramme. La relation include lie "Saisir un itinéraire" à "Calculer les itinéraires" : le calcul est systématiquement déclenché à la soumission du formulaire. La relation extend lie "Activer le filtre PMR" à "Saisir un itinéraire" : c'est une extension optionnelle, conditionnée à l'activation explicite par l'usager dans son profil. Cette distinction materialise la règle de gestion fondamentale du planificateur : le système calcule toujours un itinéraire, mais adapte ses filtres et pondérations selon le profil actif.

---

## C2. Diagramme de séquences

Le diagramme de séquences détaille le flux complet d'un calcul d'itinéraire, depuis la saisie utilisateur jusqu'à l'affichage des résultats triés. Il implique neuf participants : l'acteur citoyen, le frontend PWA, le contrôleur HTTP du module de routing, le service de routing, le sélecteur de providers, les deux providers de transport, le cache météo et le service de scoring.

La double validation des entrées apparaît en ouverture du flux. Le frontend valide la saisie via un schéma Zod côté client avant l'envoi, et le middleware serveur revalide les mêmes données à réception. Cette redondance est intentionnelle : elle applique le principe de défense en profondeur recommandé par l'OWASP (Open Web Application Security Project, référentiel de sécurité des applications web) et protège le backend même si le client est contourné.

La délégation à `selectProviders()` illustre le pattern Stratégie documenté dans l'architecture. `routing.service` ne connaît jamais directement les APIs externes. Il soumet les modes demandés au sélecteur, qui retourne la liste des implémentations de `TransportProvider` pertinentes : `TransitousProvider` pour les modes de transport en commun (bus, tramway, navibus, train), `OsrmProvider` pour les modes actifs (vélo, marche, scooter électrique).

Le bloc parallèle `Promise.all()` matérialise l'optimisation de latence identifiée par la démarche DMAIC présentée dans la section Pilotage. Les deux providers sont interrogés simultanément. La latence totale est celle du plus lent des deux, et non leur somme.

Le cache météo apparaît comme un participant distinct, doté d'une logique de décision propre : si la donnée météo pour les coordonnées demandées est présente et récente (TTL de dix minutes), l'appel à OpenWeatherMap est élidé. Cette logique de cache réduit les dépendances réseau aux API externes et maintient le KPI de temps de réponse p95 inférieur à deux secondes.

Enfin, `scoring.service` reçoit les itinéraires filtrés, les données météo et le profil de préférence, applique la formule multicritères et retourne les itinéraires triés par score décroissant. Le frontend reçoit une liste ordonnée et l'affiche sans tri supplémentaire, conformément au principe de séparation des responsabilités entre couches.

---

## C3. Diagramme de communication

Le diagramme de communication représente les mêmes échanges que le diagramme de séquences, depuis une perspective structurelle. L'axe du temps disparaît. Les participants deviennent des nœuds reliés par des liens de collaboration. L'ordre des messages est exprimé par une numérotation hiérarchique apposée sur chaque flèche.

La lecture de ce diagramme révèle trois propriétés architecturales que la séquence ne met pas aussi nettement en évidence.

Premièrement, `routing.service` est le nœud central de la collaboration. Il reçoit la requête du contrôleur (message 1), délègue la sélection des providers (2), déclenche les appels parallèles (3 et 4), interroge le cache météo (5) et délègue le scoring (6). Cette concentration de liaisons illustre le rôle d'orchestrateur que l'architecture lui attribue. Aucune autre couche du système ne détient autant de connexions directes.

Deuxièmement, `TransitousProvider` et `OsrmProvider` ne communiquent jamais entre eux. Chacun entretient deux relations : une vers `routing.service` (qui le sollicite et reçoit sa réponse) et une vers son API externe. Cette indépendance est l'objectif premier du pattern Stratégie : ajouter un troisième provider, un opérateur de covoiturage par exemple, ne modifie ni `TransitousProvider` ni `OsrmProvider`, ni `routing.service`.

Troisièmement, `weatherCache` apparaît comme un objet à part entière, distinct de l'API OpenWeatherMap. Il reçoit les requêtes de `routing.service` (5) et décide seul si un appel externe est nécessaire (5.1). Cette séparation matérialise la règle d'éco-conception posée dans les contraintes du projet : ne jamais appeler une API externe si la donnée est déjà disponible en mémoire.
