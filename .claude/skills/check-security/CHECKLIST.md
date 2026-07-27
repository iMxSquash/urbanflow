# Checklist de revue manuelle — par catégorie

Liste exhaustive chargée depuis la Phase 2 du SKILL. Chaque section : le **motif à traquer**,
des **commandes de repérage** (adapter au langage détecté), et le **critère de vulnérabilité**.
Traque le motif dangereux, pas le mot-clé. Suis toujours la donnée non fiable jusqu'au sink.

---

## A01 — Broken Access Control (le plus fréquent, le plus grave)

**IDOR / autorisation manquante.** Le contrôle d'accès horizontal (accéder aux données d'un autre user) et vertical (accéder à une action d'un rôle supérieur) est la faille n°1.

```bash
grep -rEn "req\.(params|query|body)\.(id|user_?id|account)|/:id" --include=*.{ts,js,py,go,java,rb,php} . | grep -v node_modules
```
- Toute requête DB filtre par l'identité issue **du token vérifié serveur** (`req.user.id`), jamais d'un id fourni par le client. Un `WHERE id = $paramFromUrl` sans `AND user_id = $fromToken` = IDOR.
- Chaque route mutante/sensible a un middleware d'authz **avant** le handler. Cherche les routes qui l'oublient (comparer route par route).
- Les vérifications de rôle sont côté serveur, jamais seulement dans l'UI. Pas de « sécurité par obscurité » (endpoint caché mais non protégé).
- Élévation via mass assignment : un `User.update(req.body)` qui laisse passer `role`/`isAdmin`/`user_id`. Cherche les affectations en masse d'objets requête vers modèles.
- Path traversal : `req` → `fs.readFile`/`sendFile`/`open(path)` sans normalisation ni allowlist (`../../etc/passwd`).
- CORS trop permissif : `origin: '*'` **avec** `credentials: true`, ou reflet non validé de l'`Origin`.

## A02 — Cryptographic Failures

```bash
grep -rEn "md5|sha1|createCipher\b|DES|RC4|ECB|Math\.random|http://" --include=*.{ts,js,py,go,java,rb,php} . | grep -v node_modules
```
- Mots de passe : hash **lent et salé** (bcrypt/argon2/scrypt/PBKDF2), jamais MD5/SHA1/SHA256 nu. bcrypt ≥ 10 rounds.
- Comparaison de secrets/tokens en **temps constant** (`crypto.timingSafeEqual`, `hmac.compare`), pas `==`.
- Aléa cryptographique (`crypto.randomBytes`, `secrets`) pour tokens/CSRF/mots de passe temporaires — jamais `Math.random`.
- Pas de chiffrement maison ; AES-GCM/ChaCha20 et non ECB. IV/nonce aléatoire et unique.
- Données sensibles en transit : HTTPS forcé (HSTS), pas d'URL `http://` en dur vers des services sensibles.
- Secrets au repos : chiffrés ou dans un gestionnaire (Vault, KMS, secrets du CI), pas dans la DB en clair.

## A03 — Injection

**SQL / NoSQL.**
```bash
grep -rEn "query\(\`|query\('.*\+|execute\(.*%|f\"SELECT|f'SELECT|\.raw\(|\\\$where|\{\s*\\\$" --include=*.{ts,js,py,go,java,rb,php} . | grep -v node_modules
```
- SQL : requêtes **paramétrées** partout (`$1`, `?`, placeholders nommés). Toute concaténation/template avec une entrée = critique. Noms de table/colonne dynamiques → allowlist stricte, jamais l'entrée directe.
- NoSQL (Mongo) : un objet utilisateur passé tel quel dans un filtre permet `{$ne:null}`, `{$gt:''}`. Caster/valider les types avant la requête.
- ORM : attention aux échappatoires (`.raw()`, `sequelize.literal`, `queryRaw`) qui rouvrent l'injection.

**Command / OS injection.**
```bash
grep -rEn "exec\(|execSync|spawn\(|system\(|popen|os\.system|subprocess.*shell=True|child_process|Runtime\.exec|`.*\\\$" --include=*.{ts,js,py,go,java,rb,php} . | grep -v node_modules
```
- Jamais d'entrée utilisateur dans une commande shell. Utiliser les formes tableau d'arguments (`execFile`, `spawn` sans `shell:true`, `subprocess.run([...], shell=False)`).

**Autres injections.** LDAP, XPath, template (SSTI : entrée dans `render_template_string`, `eval` de template), en-têtes (CRLF injection dans les redirections/headers), log injection.

## A04 — Insecure Design

- Logique métier : opérations financières/de points/de quota vérifient les invariants côté serveur (pas de solde négatif, pas de prix venant du client, pas de quantité négative).
- Workflows multi-étapes : impossible de sauter une étape en appelant directement l'endpoint final (ex. valider un paiement sans l'avoir initié).
- Rate limiting / anti-abus sur les fonctions coûteuses ou sensibles (login, reset password, envoi d'email/SMS, endpoints de calcul lourd).
- **Race conditions / TOCTOU** : un check puis une action non atomiques sur une ressource partagée (double-spend de points, double inscription, dépassement de stock). Chercher `check-then-act` sans transaction/verrou (`SELECT` puis `UPDATE` hors transaction, incréments non atomiques).

## A05 — Security Misconfiguration

```bash
grep -rEn "debug\s*=\s*true|DEBUG\s*=|NODE_ENV|app\.use\(helmet|cors\(|X-Powered-By|trust proxy" --include=*.{ts,js,py,go,java,rb,php,env,yml,yaml} . | grep -v node_modules
```
- Mode debug/verbose désactivé en prod ; pas de stack trace renvoyée au client (fuite de chemins, versions, requêtes SQL).
- Headers de sécurité présents : `Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `X-Frame-Options`/frame-ancestors, `Strict-Transport-Security`, `Referrer-Policy`. Bannière serveur masquée (`X-Powered-By` off).
- Endpoints d'admin/debug/actuator/metrics/swagger non exposés publiquement en prod sans auth.
- Défauts durcis : comptes par défaut supprimés, listing de répertoire off, méthodes HTTP inutiles (TRACE) désactivées.
- CORS : origine explicite en allowlist, pas de wildcard avec credentials.
- Uploads : type MIME **et** contenu validés, taille bornée, stockés hors webroot, noms de fichiers régénérés, exécution désactivée sur le dossier.

## A06 — Vulnerable & Outdated Components (supply chain)

- Résultats de `npm/pip/go` audit de la Phase 1 : traiter les CVE **exploitables dans le contexte** (une CVE dans une dép de dev non déployée ≠ une CVE dans une dép runtime exposée).
- Lockfile committé et intègre. Pas de dépendance pointant sur une branche git/URL arbitraire.
- Dépendances récemment ajoutées dans le diff : typosquatting (nom proche d'un package connu), mainteneur inconnu, package quasi vide qui exfiltre à l'install (`postinstall` suspect).
```bash
grep -rEn "\"(preinstall|postinstall|install)\"\s*:" package.json 2>/dev/null
```

## A07 — Identification & Authentication Failures

```bash
grep -rEn "jwt\.(sign|verify)|session|cookie\(|setCookie|bcrypt|passport|OAuth|refresh" --include=*.{ts,js,py,go,java,rb,php} . | grep -v node_modules
```
- **JWT** : algorithme fixé côté serveur (rejeter `alg:none` et la confusion RS256→HS256) ; signature **vérifiée** avant usage ; `exp` court sur l'access token ; payload minimal (id + rôle, pas de PII/secret) ; secret fort (≥ 32 octets aléatoires), hors du code.
- **Cookies de session/refresh** : `HttpOnly`, `Secure`, `SameSite=Strict|Lax`. Refresh token révocable côté serveur (stocké/listé), rotation à l'usage.
- **Login** : réponse identique pour « user inconnu » et « mot de passe faux » (anti-énumération) ; rate-limit + lockout progressif ; MFA si actifs sensibles.
- **Reset password** : token à usage unique, expirant, aléatoire crypto, invalidé après usage ; pas d'oracle d'existence de compte.
- **Fixation de session** : régénérer l'identifiant de session à l'élévation de privilège (post-login).
- Pas de secret/token loggé, pas de token en URL (fuite via referer/logs), jamais en `localStorage` si XSS possible.

## A08 — Software & Data Integrity Failures

```bash
grep -rEn "pickle|yaml\.load\b|unserialize|Marshal\.load|readObject|JSON\.parse\(.*req|eval\(|Function\(|deserialize" --include=*.{ts,js,py,go,java,rb,php} . | grep -v node_modules
```
- **Désérialisation non sûre** : `pickle.loads`, `yaml.load` (sans `SafeLoader`), `unserialize` PHP, Java `readObject` sur données non fiables = RCE. Utiliser des formats de données (JSON) et des loaders sûrs.
- `eval`/`new Function`/`exec` sur de l'entrée = critique.
- Intégrité des mises à jour/CI : artefacts signés, pas de `curl | bash` d'une source non épinglée dans les pipelines.

## A09 — Security Logging & Monitoring Failures

- Les événements de sécurité (login échoué/réussi, changement de privilège, accès refusé, suppression de données) sont journalisés — **sans** logger de secrets, mots de passe, tokens, PII brute ni données GPS nominatives.
- Les erreurs sont capturées côté serveur mais renvoient un message générique au client.
- Pas de log injection (CRLF dans les valeurs loggées).

## A10 — Server-Side Request Forgery (SSRF)

```bash
grep -rEn "fetch\(|axios\.|requests\.(get|post)|http\.get|urllib|HttpClient|file_get_contents|curl_exec" --include=*.{ts,js,py,go,java,rb,php} . | grep -v node_modules
```
- Toute URL sortante construite depuis une entrée utilisateur (webhook, avatar par URL, import distant, proxy) : valider le schéma (`https` only), résoudre et **bloquer les IP internes/privées** (169.254.169.254 métadonnées cloud, 127.0.0.0/8, 10/8, 172.16/12, 192.168/16, `::1`), interdire les redirections vers ces plages, timeouts stricts. Allowlist de domaines si possible.

## Transversal — Entrées & sorties

- **Validation en entrée** : tout body/query/param/header consommé passe par un schéma strict (type, bornes, longueur, enum, format) au plus près du point d'entrée. Fail-closed (rejeter par défaut).
- **Encodage en sortie (XSS)** : donnée réfléchie/stockée rendue dans du HTML → échappée par le moteur de template ; en React, traquer `dangerouslySetInnerHTML` ; jamais `innerHTML`/`document.write` avec de l'entrée. Réponses API en `application/json` avec `nosniff`.
- **Open redirect** : `res.redirect(req.query.next)` sans allowlist.
- **Secrets** : aucun en dur (Phase 1). Fail-fast au démarrage si une variable d'env obligatoire manque. `.env` gitignored.
- **Mass assignment / injection de paramètres** : allowlist des champs modifiables, jamais l'objet requête brut vers l'ORM.

---

## Invariants spécifiques UrbanFlow (si `CLAUDE.md` + `src/server/` présents)

Ces règles viennent du projet et sont **non négociables** :

- SQL via `pg` avec paramètres `$1,$2` uniquement — jamais d'interpolation (règle CLAUDE.md).
- Validation **Zod** en middleware sur chaque route, jamais dans le controller. `req.body` jamais consommé sans schéma.
- Helmet, CORS (`origin: CORS_ORIGIN`), rate-limit montés globalement dans `src/server/index.ts` ; rate-limit renforcé sur `/api/auth/login` et `/api/auth/register` (100 req/15 min/IP).
- Auth guard : `src/server/middleware/auth-guard.ts` présent avant tout handler de données utilisateur ; filtrage SQL par `req.user.id` issu du JWT (anti-IDOR).
- JWT access 15 min, payload `{ user_id, email }` max ; refresh token en cookie `HttpOnly + Secure + SameSite=Strict`, jamais dans le body ni `localStorage`.
- bcrypt ≥ 10 rounds ; réponse de login non discriminante (anti-énumération de comptes).
- Données de déplacement (C11) : coordonnées GPS arrondies à 4 décimales avant appel aux APIs externes ; géométrie détaillée non persistée (`trips` = origin/destination/agrégats) ; aucun log de coordonnées brutes liées à un user_id.
- `DELETE /api/users/me` : suppression en cascade effective (vérifier les `ON DELETE CASCADE` des migrations).
- Pas de `any` TypeScript aux frontières (utiliser `unknown` + type guard) — un `any` sur une entrée externe masque un trou de validation.
