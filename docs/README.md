# UrbanFlow SmartRoute — Cadrage projet

> Session Septembre 2026 | Titre 6 CDSD | RNCP 36146

Ce dossier contient le cadrage complet du projet, prêt à être intégré dans le repository.

## Fichiers

| Fichier | Contenu |
|---------|---------|
| `01-PERIMETRE-MVP.md` | Périmètre fonctionnel, fonctionnalités obligatoires/optionnelles/exclues, facteurs CO2 |
| `02-STACK-TECHNIQUE.md` | Stack complète avec justification de chaque choix, comparatif pour le dossier |
| `03-ARCHITECTURE.md` | Architecture monolithe modulaire, pattern Stratégie, modèle de données SQL, mode démo |
| `04-BACKLOG-SPRINTS.md` | 6 sprints × 2 semaines, tâches priorisées P0/P1/P2, livrables par sprint |
| `05-PLAN-DOSSIER.md` | Plan détaillé des 40 pages, budget par section, contenu attendu |
| `06-APIS-DONNEES.md` | Guide d'intégration de chaque API et source de données, exemples de code |
| `07-POINTS-VIGILANCE.md` | Erreurs fatales, risques, quick wins, checklist soutenance |

## Décisions clés

- **Ville** : Nantes Métropole (données ouvertes Naolib)
- **Routage** : Transitous (cloud) + OTP (dev local) + pattern Stratégie
- **Angle** : Équilibré — MVP sobre, cohérent, éco-conçu, défendable
- **Fonctionnalité au choix** : Gamification éco-mobilité
- **Hébergement** : Vercel (front) + Render (back) — justifié éco-conception
- **IA** : Moteur de scoring multicritères déterministe (pas de LLM)

## Contacts établis

- [x] Transitous (Matrix `#transitous:matrix.spline.de`) — accord d'utilisation
- [ ] Nantes Métropole (data.nantesmetropole.fr) — demande SIRI complet en cours
