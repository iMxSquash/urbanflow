# Contribuer

UrbanFlow SmartRoute est un projet académique développé en solo dans le cadre du Titre 6 Concepteur Développeur Solutions Digitales (RNCP 36146). Le dépôt est public à des fins de portfolio et d'évaluation, mais n'est pas ouvert à des contributions externes fusionnées : voir [`LICENSE`](LICENSE).

Les issues et discussions restent bienvenues (bug repéré, question sur un choix technique) : voir [Signaler un problème](#signaler-un-problème). Ce document décrit surtout le workflow suivi pour le projet, pour la traçabilité et la cohérence de l'historique.

## Signaler un problème

- Bug : utiliser le [modèle de rapport de bug](.github/ISSUE_TEMPLATE/bug_report.yml).
- Question ou suggestion : utiliser le [modèle de demande de fonctionnalité](.github/ISSUE_TEMPLATE/feature_request.yml) ou les Discussions.
- Vulnérabilité de sécurité : **ne pas ouvrir d'issue publique**, suivre [`SECURITY.md`](SECURITY.md).

## Workflow de développement

### Branches

- `main` : branche principale, toujours déployable
- `feat/nom-feature` : nouvelle fonctionnalité
- `fix/nom-bug` : correction d'un bug relevé en développement, avant mise en prod
- `hotfix/nom-bug` : correctif urgent sur un incident déjà en production, branché depuis `main`

### Commits

Convention [Conventional Commits](https://www.conventionalcommits.org/) : `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`.

- Description en anglais, à l'impératif, < 72 caractères
- Un commit = un changement logique cohérent (pas de commit fourre-tout)
- Pas de trailer `Co-Authored-By`

### Avant d'ouvrir une pull request

```bash
npm run type-check
npm run lint -- --max-warnings 0
npm test
npm run build
```

Ce sont exactement les vérifications exécutées par la CI ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)). Une PR qui ne les passe pas localement ne passera pas en CI.

Pour les changements touchant l'UI, l'accessibilité est vérifiée manuellement avec Axe DevTools avant merge (WCAG 2.1 AA, non automatisé en CI).

### Principes de code

- **DRY / KISS / YAGNI / SRP** : pas de sur-ingénierie, pas d'abstraction prématurée, une responsabilité par module
- TypeScript strict, jamais de `any`
- Pas de commentaire qui explique le *quoi*, seulement le *pourquoi* quand ce n'est pas évident
- Détail complet des conventions (nommage, structure Express/React, SQL, Tailwind…) dans [`CLAUDE.md`](CLAUDE.md)

## Pull requests

Même en développement solo, chaque changement passe par une pull request vers `main` pour conserver l'historique et la revue. Le [modèle de PR](.github/PULL_REQUEST_TEMPLATE.md) reprend cette checklist.
