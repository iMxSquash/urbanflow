# .claude/skills/new-module/SKILL.md
---
name: new-module
description: Scaffold un nouveau module backend Express selon l'architecture du projet.
---

Crée un nouveau module backend dans `src/server/modules/$ARGUMENTS/` avec :

1. `$ARGUMENTS.routes.ts` — définition des routes Express avec Swagger JSDoc
2. `$ARGUMENTS.controller.ts` — logique HTTP uniquement (parse req, send res)
3. `$ARGUMENTS.service.ts` — logique métier
4. `$ARGUMENTS.schema.ts` — schémas Zod pour validation des entrées
5. `$ARGUMENTS.types.ts` — types TypeScript du module
6. `index.ts` — export du router

Le controller ne contient JAMAIS de logique métier.
Le service ne connaît JAMAIS Express (pas de req/res).
La validation Zod est un middleware, jamais dans le controller.
Les requêtes SQL utilisent TOUJOURS des paramètres ($1, $2).
Chaque route a sa documentation Swagger.

Exemple : `/new-module gamification`