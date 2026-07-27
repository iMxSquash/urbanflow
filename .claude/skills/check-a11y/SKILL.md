---
name: check-a11y
description: Audit d'accessibilité WCAG 2.1 AA sur un composant, une page ou le diff en cours. Utiliser avant chaque merge significatif touchant l'UI, ou quand l'utilisateur demande un audit a11y.
---

# Audit accessibilité WCAG 2.1 AA

## Périmètre

- Avec argument : `/check-a11y src/client/pages/MapPage.tsx` → auditer ce fichier et ses composants enfants directs.
- Sans argument : auditer les fichiers `.tsx` modifiés dans `git diff` (staged + unstaged) ; si le diff est vide, les fichiers `.tsx` modifiés par rapport à `main`.

## Checks

Pour chaque fichier du périmètre, vérifier dans cet ordre :

### 1. Alternatives textuelles (WCAG 1.1.1)
- Tout `<img>` a un `alt` **descriptif** (pas `alt=""` sauf image décorative explicite, pas `alt="image"`).
- Toute icône SVG porteuse de sens a un `aria-label`, un `<title>` ou un `<span className="sr-only">` adjacent. Une icône purement décorative a `aria-hidden="true"`.

### 2. Formulaires (WCAG 1.3.1, 3.3.2)
- Chaque champ est associé à un `<label htmlFor>` + `id`, ou porte un `aria-label`.
- Les messages d'erreur sont liés au champ via `aria-describedby` et le champ invalide porte `aria-invalid="true"`.

### 3. Boutons et éléments interactifs (WCAG 4.1.2, 2.1.1)
- Tout bouton icône sans texte visible a un `aria-label`.
- Aucun `onClick` sur `<div>`/`<span>` sans `role="button"` + `tabIndex={0}` + gestion `onKeyDown` (Enter/Espace). Proposer un `<button>` natif en correction prioritaire.
- Pas de `tabIndex` > 0. L'ordre du DOM doit correspondre à l'ordre visuel.

### 4. Focus visible (WCAG 2.4.7)
- Aucun `focus:outline-none` sans remplacement `focus:ring` / `focus-visible:` visible.
- `grep -n "outline-none" <fichiers>` puis vérifier chaque occurrence.

### 5. Contrastes (WCAG 1.4.3) — tokens Urban Night
Les couleurs viennent exclusivement des tokens `@theme` de `src/client/index.css`. Points de vigilance connus :
- `text-text-muted` et `text-text-disabled` sur `bg-bg-card`/`bg-bg-elevated` : les combinaisons *muted/disabled × surfaces claires* sont les plus proches du seuil — calculer le ratio réel si un texte informatif (pas décoratif ni disabled) les utilise.
- Les couleurs de mode (`--color-mode-bus: #fcd34d`, `--color-mode-walk: #94a3b8`…) ne doivent jamais servir de couleur de **texte** sur fond clair — uniquement en pastille/icône avec libellé adjacent.
- Vérifier les DEUX thèmes : les tokens `bg-*`/`text-*` sont redéfinis en dark (lignes ~223-237 de index.css). Un ratio valide en dark ne garantit rien en light.
- Seuils : ≥ 4.5:1 texte normal, ≥ 3:1 texte large (≥ 24px ou 18.5px bold) et composants UI.

### 6. Carte Leaflet
- Le conteneur de carte porte `role="application"` et `aria-label` (ex. "Carte des itinéraires Nantes Métropole").
- Les contrôles custom superposés à la carte restent atteignables au clavier.

### 7. Sémantique et structure (WCAG 1.3.1, 2.4.6)
- Hiérarchie de titres sans saut (`h1` → `h2` → `h3`).
- La bottom nav utilise `<nav>` + `aria-label`, l'onglet actif porte `aria-current="page"`.
- Les listes de résultats d'itinéraires sont des `<ul>/<li>`, pas des suites de `<div>`.

## Sortie

Tableau par fichier : `ligne | critère WCAG | problème | correction proposée`, classé bloquant (échec AA certain) / à vérifier (dépend du rendu, ex. contraste à mesurer) / amélioration (au-delà de AA).

Si aucun problème : le dire explicitement, puis rappeler que cet audit statique ne remplace pas l'audit Axe DevTools manuel exigé par CLAUDE.md avant chaque merge significatif (à faire navigateur ouvert, sur les 5 écrans du parcours principal, dans les deux thèmes).

Ne PAS corriger automatiquement : lister d'abord, appliquer les corrections seulement si l'utilisateur le demande.
