# Politique de sécurité

## Portée

UrbanFlow SmartRoute est un projet académique solo (Titre 6 CDSD, RNCP 36146), pas un produit en exploitation commerciale. Cette politique s'applique néanmoins sérieusement : le projet implémente une authentification réelle (JWT, bcrypt, rotation de refresh tokens) et traite des données personnelles (profil de mobilité, RGPD), donc les vulnérabilités qui affecteraient ces mécanismes sont traitées avec priorité.

## Versions supportées

Un seul environnement est maintenu : la branche `main`, correspondant au déploiement de démonstration (Vercel + Render). Aucune version antérieure n'est rétro-corrigée.

| Version | Support |
|---------|---------|
| `main`  | ✅ |
| autre branche / fork | ❌ |

## Signaler une vulnérabilité

Merci de **ne pas ouvrir d'issue publique** pour une faille de sécurité potentielle (injection, contournement d'authentification, fuite de données, IDOR, etc.).

Deux canaux, par ordre de préférence :

1. [Signaler via un GitHub Security Advisory privé](https://github.com/iMxSquash/urbanflow/security/advisories/new) (onglet *Security* du dépôt).
2. Email à **coussotelwen@gmail.com** avec, si possible :
   - une description du problème et de son impact ;
   - les étapes de reproduction ou un proof-of-concept minimal ;
   - la version/commit concerné.

Je m'engage à accuser réception sous 72h et à tenir le rapporteur informé de l'avancement de la correction. Merci de laisser un délai raisonnable avant toute divulgation publique.

## Mesures en place

Pour situer le niveau de maturité attendu (détail dans [`CLAUDE.md`](CLAUDE.md#sécurité-owasp--règles-strictes) et [`CLAUDE.md`](CLAUDE.md#auth)) :

- Helmet, CORS restreint à l'origine du frontend, rate limiting global et par route (`/api/auth` renforcé)
- Validation Zod de toutes les entrées utilisateur, requêtes SQL paramétrées (pas de string interpolation)
- Mots de passe hashés bcrypt (rounds ≥ 10) ; timing égalisé sur `login` et la récupération de compte pour empêcher l'énumération d'emails
- JWT access token courte durée (15 min) + refresh token en cookie `HttpOnly`/`Secure`/`SameSite=Strict`, à usage unique avec rotation
- Aucun token en `localStorage`, aucune donnée sensible dans le payload JWT
- Aucune coordonnée GPS précise conservée en base au-delà du calcul d'itinéraire

## Hors périmètre

- Attaques par déni de service (DoS/DDoS) contre le déploiement de démonstration
- Ingénierie sociale, phishing
- Vulnérabilités dans les dépendances tierces déjà signalées publiquement (`npm audit`, GitHub Dependabot) : ouvrir une issue standard dans ce cas
