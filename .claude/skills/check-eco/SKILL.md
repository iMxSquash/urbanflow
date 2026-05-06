# .claude/skills/check-eco/SKILL.md
---
name: check-eco
description: Vérifie les principes d'éco-conception sur le code frontend.
---

Analyse le code frontend et vérifie :

1. Pas d'import de bibliothèque entière quand un import partiel suffit
2. Les images sont en WebP ou compressées
3. Les routes React utilisent `React.lazy()` + `Suspense`
4. Pas d'appel API redondant (données déjà en store Zustand)
5. Le cache météo OpenWeather est bien implémenté (Map JS, TTL 10min)
6. Pas de polling inutile (setInterval sur des données statiques)
7. Les composants lourds (carte, graphiques) sont lazy-loaded
8. Pas de CSS inutilisé (Tailwind purge les classes non utilisées via Vite)

Suggère les optimisations possibles avec impact estimé sur le bundle.