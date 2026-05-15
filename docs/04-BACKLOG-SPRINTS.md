# Backlog priorisé — 6 sprints × 2 semaines

## Sprint 0 — Fondations (semaine 1–2)

| Priorité | Tâche | Validation |
|----------|-------|------------|
| P0 | Init Vite + React + TS + Tailwind + Zustand | `npm run dev` fonctionne |
| P0 | Init Express + TS + PostgreSQL + PostGIS sur Render | `/health` → 200 en HTTPS |
| P0 | Config PWA (manifest + SW basique via vite-plugin-pwa) | Chrome propose l'installation |
| P0 | CI GitHub Actions (lint + build — **pas Lighthouse**) | Pipeline verte sur push |
| P0 | Déploiement Vercel (front) + Render (back) | URL publique HTTPS |
| P1 | Modèle de données initial (users, profils, scores) | Migration SQL exécutable |
| P1 | Setup Swagger/OpenAPI sur l'API Express | `/api-docs` accessible |

**Livrable** : Coquille vide installable en PWA avec CI + déploiement fonctionnels.

---

## Sprint 1 — Auth & Profil (semaine 3–4)

| Priorité | Tâche | Validation |
|----------|-------|------------|
| P0 | Inscription + connexion (JWT + refresh token HttpOnly) | Cycle complet testé |
| P0 | Hashage bcrypt + validation Zod (entrées) | Injection impossible |
| P0 | Page profil de mobilité (préférences transport, confort) | CRUD complet en BDD |
| P0 | Store Zustand : user + preferences + auth state | State centralisé, pas de prop drilling |
| P1 | Consentement RGPD géolocalisation (popup) | Popup avant activation GPS |
| P1 | Responsive mobile (auth + profil) | Test sur viewport 375px |

**Livrable** : F1 complète et sécurisée.

---

## Sprint 2 — Carte & Géolocalisation (semaine 5–6)

| Priorité | Tâche | Validation |
|----------|-------|------------|
| P0 | Intégration Leaflet + tuiles CartoDB Positron | Carte centrée sur Nantes |
| P0 | Géolocalisation navigateur + fallback saisie manuelle | Position détectée ou adresse saisie |
| P0 | Affichage stations Bicloo sur la carte (API GBFS) | Marqueurs vélos visibles |
| P0 | Appel Transitous : calcul itinéraire A→B multimodal | Réponse JSON parsée et loggée |
| P1 | Affichage tracé itinéraire sur Leaflet (polyline colorée par mode) | Tracé visible sur la carte |

**Livrable** : Carte fonctionnelle + premier appel Transitous réussi. Sprint le plus risqué (intégration API tierce).

---

## Sprint 3 — Moteur de scoring & Multimodal complet (semaine 7–8)

| Priorité | Tâche | Statut | Validation |
|----------|-------|--------|------------|
| P0 | Algorithme de scoring (durée × CO2 × préférences) | ✅ Fait | `scoring.service.ts` — 153 tests |
| P0 | Modes multimodaux complets (bus/tram/navibus/train/vélo/marche/scooter) | ✅ Fait | TransitousProvider + OsrmProvider |
| P0 | Accessibilité PMR (filtre dur maxWalkMinutes, pénalités scoring) | ✅ Fait | `pmrAccessibility` dans JourneyOptions |
| P0 | Affichage comparatif des itinéraires (durée, CO2, coût) | ✅ Fait | `JourneyPanel.tsx` |
| P0 | Mode démo (`DEMO_MODE` + fichiers JSON statiques) | ✅ Fait | `DemoProvider` |
| P0 | Appel OpenWeather → pondération météo dans le scoring | ❌ À faire | Pluie → TC favorisé |
| P1 | SIRI-Lite : prochains passages à l'arrêt le plus proche | ❌ À faire | Horaires affichés en temps réel |
| P1 | Gestion des erreurs API (timeout, fallback gracieux côté UI) | ⚠️ Partiel | Timeout providers OK, message UX manquant |

**Livrable** : F2 + F3 fonctionnels + mode démo opérationnel.

---

## Sprint 4 — Gamification & Dashboard (semaine 9–10)

| Priorité | Tâche | Validation |
|----------|-------|------------|
| P0 | Calcul CO2 par trajet (facteurs ADEME par mode) | Score CO2 à chaque itinéraire choisi |
| P0 | Système de points (CO2 économisé vs voiture → points) | Points enregistrés en BDD |
| P0 | Badges débloquables (seuils configurables) | Badge visible en profil |
| P1 | Dashboard personnel (graphique mensuel, stats) | Graphique Recharts fonctionnel |
| P1 | Accessibilité WCAG 2.1 AA (audit Axe DevTools + corrections) | Zéro erreur critique Axe |
| P2 | Toggle carte de chaleur éco (itinéraires colorés vert→rouge) | 20 lignes Leaflet, visuel fort en démo |

**Livrable** : Fonctionnalité au choix complète.

---

## Sprint 5 — Sécurisation, Polish & Dossier (semaine 11–12)

| Priorité | Tâche | Validation |
|----------|-------|------------|
| P0 | Sécurité OWASP (helmet, rate limit, CSRF, sanitization) | Checklist vérifiée |
| P0 | Audit Lighthouse **local** (perf + PWA + a11y) | Captures d'écran avec scores |
| P0 | Éco-conception : audit bundle (vite-bundle-visualizer) | Bundle < 300 ko gzip |
| P0 | Tests unitaires module scoring (Vitest) | Couverture > 60% scoring |
| P0 | Rédaction complète du dossier PDF | 40 pages, relu |
| P1 | Script de démo soutenance (scénarios pré-testés) | Démo fluide en 15 min |
| P1 | Mode offline partiel (dernier itinéraire en cache SW) | Consultation hors réseau |

---

## Dépendances inter-sprints

```
Sprint 0 (fondations)
   └──→ Sprint 1 (auth)
           └──→ Sprint 2 (carte) ← Sprint le plus risqué
                   └──→ Sprint 3 (scoring)
                           └──→ Sprint 4 (gamification)
                                   └──→ Sprint 5 (polish + dossier)
```

Le Sprint 2 est le point de risque maximal car il dépend de l'intégration réussie avec Transitous. Si l'API ne répond pas comme prévu, le mode démo (Sprint 3) absorbe le risque.
