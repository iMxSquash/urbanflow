# .claude/skills/demo-scenario/SKILL.md
---
name: demo-scenario
description: Génère ou met à jour un scénario de données démo pour la soutenance.
---

Crée ou met à jour un fichier JSON dans `src/demo-data/` pour le scénario décrit.

Chaque fichier JSON doit reproduire exactement le format de réponse de l'API réelle :
- Transitous : format MOTIS journey response
- OpenWeather : format weather API response
- GBFS Bicloo : format GBFS station_status
- SIRI-Lite : format SIRI MonitoredStopVisit

Les coordonnées GPS doivent être des lieux réels de Nantes.
Les horaires doivent être cohérents entre eux.
Le scénario doit être testable de bout en bout.

Exemple : `/demo-scenario pluie heure-de-pointe commerce-vers-gare`