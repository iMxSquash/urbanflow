# .claude/skills/check-security/SKILL.md
---
name: check-security
description: Audit sécurité OWASP sur le code backend. Auto-invoqué sur les fichiers server/.
---

Vérifie le fichier ou module backend indiqué :

1. **Injection** : toutes les requêtes SQL utilisent des paramètres ($1, $2), jamais de string interpolation
2. **Auth** : les routes protégées ont le middleware auth guard
3. **Validation** : toutes les entrées utilisateur passent par un schéma Zod
4. **Headers** : helmet est appliqué globalement
5. **Rate limiting** : les routes sensibles (login, register) ont un rate limit spécifique
6. **CSRF** : les cookies ont SameSite=Strict
7. **Tokens** : pas de données sensibles dans le payload JWT (juste user_id)
8. **Secrets** : aucune clé API en dur dans le code (vérifier .env)

Retourne les vulnérabilités trouvées avec sévérité (critique/haute/moyenne) et correction.