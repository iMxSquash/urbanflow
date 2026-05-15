# Périmètre du MVP — UrbanFlow SmartRoute

## Territoire pilote

**Nantes Métropole** — réseau Naolib (Semitan).

Justification : disponibilité de données ouvertes standardisées (GTFS, SIRI, SIRI-Lite, NeTEx, GBFS vélos) sur transport.data.gouv.fr et data.nantesmetropole.fr. Réseau suffisamment riche (tramways, bus, navibus, vélos Bicloo) sans être écrasant comme l'Île-de-France.

> « Nous avons sélectionné Nantes Métropole comme territoire pilote pour la disponibilité de ses données ouvertes standardisées et la taille maîtrisable de son réseau. Le pattern Stratégie en couche d'abstraction permet de transposer la plateforme à toute métropole couverte par Transitous ou disposant d'une instance OTP. »

---

## Fonctionnalités obligatoires

### F1 — Authentification & Profil de mobilité

- Inscription / connexion par email + mot de passe
- Profil enrichi : préférences de transport (vélo, trottinette, TC, covoiturage), confort (marche max, dénivelé), préférence éco vs rapide
- Le profil alimente directement le scoring d'itinéraire

### F2 — Planificateur d'itinéraires multimodal + géolocalisation

- Saisie point A → point B
- 2 à 3 propositions d'itinéraires combinant différents modes
- Chaque proposition affiche : durée, distance, empreinte CO2, mode(s)
- Carte Leaflet avec tracé des segments colorés par mode
- Géolocalisation du point de départ via API Geolocation + fallback saisie manuelle
- Routage multimodal via **Transitous** (API MOTIS) en production, **OTP** en développement local

### F3 — Intégration APIs de transport (GTFS, vélos)

- Données GTFS Naolib consommées par Transitous (pas d'ETL local nécessaire)
- Affichage stations Bicloo (vélos) via API GBFS JCDecaux sur la carte
- Prochains passages aux arrêts via SIRI-Lite (clé `opendata`)

---

## Fonctionnalité au choix retenue : Gamification éco-mobilité

- Chaque itinéraire choisi génère un score CO2 (basé sur les facteurs ADEME)
- Points accumulés quand l'utilisateur choisit un mode doux
- Badges débloqués selon des seuils : « 10 trajets vélo », « 50 kg CO2 évités »
- Dashboard personnel avec progression mensuelle (graphique Recharts)

---

## Fonctionnalités optionnelles (si le temps le permet)

Par ordre de priorité :

1. **Calculateur carbone détaillé** — extension naturelle de la gamification, graphique d'historique
2. **Alertes/notifications** — notifications push via service worker (cohérent avec C1 PWA)
3. **Signalement collaboratif** — CRUD formulaire + carte, démontre l'interopérabilité

---

## Fonctionnalités exclues (hors périmètre)

| Fonctionnalité | Raison de l'exclusion |
|----------------|----------------------|
| Covoiturage dynamique avec matching | Complexité trop élevée pour un MVP solo (temps réel bidirectionnel, algorithme de matching, masse critique fictive) |
| IA conversationnelle / LLM | Contradiction directe avec C5 éco-conception. Indéfendable devant jury |
| Architecture microservices | Sur-ingénierie pour un projet solo. Monolithe modulaire plus défendable |
| Réservation avec paiement | Complexité métier énorme (créneaux, annulations, paiement). Aucun retour proportionnel en points |

---

## Facteurs d'émission CO2 (source ADEME)

Référence à citer dans le dossier : **Base Empreinte de l'ADEME**.

| Mode | Facteur | Source |
|------|---------|--------|
| Voiture thermique | 253 g CO2e/km | Base Empreinte ADEME |
| Bus | 109 g CO2e/km/passager | Base Empreinte ADEME |
| Tramway | 4 g CO2e/km/passager | électrique réseau Naolib, Base ADEME |
| Navibus | 50 g CO2e/km/passager | ferry Loire — estimation Base ADEME |
| Train (TER) | 14 g CO2e/km/passager | TER électrifié, Base Empreinte ADEME |
| Vélo / marche / trottinette électrique | 0 g usage | référence ADEME |

Le scoring CO2 d'un itinéraire = somme des (distance segment × facteur du mode du segment).
L'économie CO2 = score voiture équivalent – score itinéraire choisi.
