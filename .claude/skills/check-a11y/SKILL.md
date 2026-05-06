# .claude/skills/check-a11y/SKILL.md
---
name: check-a11y
description: Audit d'accessibilité WCAG 2.1 AA sur le composant ou la page en cours.
---

Analyse le fichier ou composant React indiqué et vérifie :

1. Tous les `<img>` ont un attribut `alt` descriptif
2. Tous les champs de formulaire ont un `<label>` associé ou `aria-label`
3. Les boutons icône ont un `aria-label`
4. Les contrastes de couleur respectent WCAG AA (ratio ≥ 4.5:1 texte normal, ≥ 3:1 texte large)
5. La navigation clavier est logique (pas de tabindex > 0, focus visible)
6. Les éléments interactifs sont atteignables au clavier
7. La carte Leaflet a `role="application"` et `aria-label`
8. Pas de `onClick` sur des `<div>` sans `role="button"` et `tabIndex={0}`

Retourne une liste de problèmes trouvés avec la ligne exacte et la correction proposée.
Si aucun problème : confirme la conformité.