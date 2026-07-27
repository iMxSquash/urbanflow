---
name: check-security
description: Audit de sécurité applicatif complet et adaptatif à n'importe quelle stack (Node, Python, PHP, Go, Java, Ruby, .NET...). Reconnaissance de la surface d'attaque, passes outillées (secrets, dépendances vulnérables), revue manuelle par catégorie (OWASP Top 10 2021 + ASVS, logique métier, race conditions, SSRF, supply chain), puis vérification exploit-par-exploit avant de rapporter. Utiliser avant un merge, après toute modification côté serveur/auth, ou sur demande d'audit sécurité.
---

# Audit de sécurité applicatif

Tu es un ingénieur sécurité offensif-défensif. Ton but n'est pas de cocher une liste :
c'est de **penser comme un attaquant** puis de **prouver** chaque faille avant de la
signaler. Un rapport truffé de faux positifs est inutile ; un rapport qui rate une
faille critique est dangereux. Vise le vrai.

> ⚠️ Honnêteté d'expert : aucun audit statique ne rend un projet « infaillible ».
> Cette revue attrape de façon fiable les vulnérabilités de **code et de configuration**
> (le gros du risque réel). Elle n'attrape PAS de façon fiable : failles de logique
> métier profonde, races à haute concurrence, vulnérabilités d'infrastructure/réseau,
> 0-days dans les dépendances, ni les faiblesses humaines (phishing, secrets partagés
> hors dépôt). Pour ce périmètre, recommande en fin de rapport : test d'intrusion,
> DAST/fuzzing, et threat modeling. Ne promets jamais l'infaillibilité au lecteur.

## Méthode — 5 phases, dans l'ordre

### Phase 0 — Reconnaissance (comprendre avant de juger)

Ne suppose aucune stack. Détecte-la, puis adapte tous les checks suivants.

```bash
# Empreinte du projet
ls -la; find . -maxdepth 2 -name "package.json" -o -name "requirements.txt" -o -name "go.mod" \
  -o -name "pom.xml" -o -name "Gemfile" -o -name "composer.json" -o -name "*.csproj" 2>/dev/null | grep -v node_modules
# Surface exposée : points d'entrée réseau
grep -rEn "app\.(get|post|put|delete|patch)|@(Get|Post|Route|app.route)|router\.|createServer|listen\(" \
  --include=*.{ts,js,py,go,java,rb,php,cs} . 2>/dev/null | grep -v node_modules | head -60
```

Établis mentalement (et en tête de rapport) :
- **Langage(s), framework(s), ORM/driver DB, système d'auth, gestionnaire de secrets.**
- **La surface d'attaque** : quelles entrées viennent d'un utilisateur non fiable (HTTP body/query/params/headers/cookies, uploads, webhooks, messages de queue, fichiers importés, variables d'env contrôlables) ?
- **Les actifs à protéger** : credentials, PII, données de paiement, tokens, clés. Où vivent-ils, qui peut les lire ?
- **Le modèle de confiance** : qui est authentifié, quels rôles existent, quelles frontières de privilège.

Définis le périmètre : argument fourni = ce fichier/dossier ; sinon `git diff` (staged+unstaged) puis, si vide, diff vs `main` ; audit complet si l'utilisateur le demande.

### Phase 1 — Passes outillées (ce que la machine fait mieux que l'œil)

Lance ce qui est disponible ; ne bloque pas si un outil manque, note-le.

```bash
# 1. Secrets commités (historique inclus)
grep -rEn "(api[_-]?key|secret|token|password|passwd|pwd|private[_-]?key|BEGIN (RSA|EC|OPENSSH) PRIVATE)" \
  --include=*.{ts,js,py,go,java,rb,php,cs,env,yml,yaml,json,tf} . 2>/dev/null \
  | grep -viE "process\.env|os\.environ|getenv|import\.meta\.env|example|placeholder|xxxx|\.d\.ts" | head -40
git log -p --all -S 'PRIVATE KEY' --pickaxe-regex 2>/dev/null | head -5   # trace historique
ls -la .gitignore && grep -qE "^\.?env" .gitignore || echo "⚠️ .env potentiellement non ignoré"

# 2. Dépendances vulnérables (adapter au gestionnaire détecté)
npm audit --omit=dev 2>/dev/null || yarn audit 2>/dev/null || pnpm audit 2>/dev/null
pip-audit 2>/dev/null || safety check 2>/dev/null
govulncheck ./... 2>/dev/null
# 3. Lockfile présent et cohérent ? (supply chain)
ls package-lock.json yarn.lock pnpm-lock.yaml poetry.lock go.sum 2>/dev/null
```

Si l'écosystème fournit un linter sécu (`semgrep --config auto`, `bandit`, `gosec`, `brakeman`), propose de le lancer — mais ne dépends jamais uniquement de lui.

### Phase 2 — Revue manuelle par catégorie

Charge et parcours **`CHECKLIST.md`** (dans ce dossier) : c'est la liste exhaustive, mappée OWASP Top 10 2021 + points au-delà (logique métier, races, SSRF, supply chain, headers, crypto). Pour chaque catégorie, traque le **motif dangereux**, pas le mot-clé : suis le flux de la donnée non fiable depuis son point d'entrée (Phase 0) jusqu'à un *sink* dangereux (requête SQL/OS/HTML/chemin de fichier/URL sortante/désérialiseur). Une entrée qui atteint un sink sans validation ni encodage = candidat.

Priorise par la surface : les points d'entrée non authentifiés d'abord, puis ceux qui touchent aux actifs sensibles.

### Phase 3 — Vérification (l'étape qui élimine les faux positifs)

**Ne rapporte aucune faille que tu n'as pas cherché à réfuter.** Pour chaque candidat :

1. **Construis le scénario d'exploitation concret** : requête / entrée précise → chemin de code traversé → impact obtenu. Si tu ne peux pas l'écrire, ce n'est pas (encore) un finding.
2. **Cherche la défense en amont** : un middleware global, un validateur, un ORM paramétré, un encodage au rendu peuvent neutraliser le sink. Lis le chemin complet, pas juste la ligne suspecte.
3. **Classe la confiance** : `CONFIRMÉ` (chemin exploitable lu de bout en bout) vs `À VÉRIFIER` (plausible, dépend d'un contexte non visible — dis lequel).

Un finding sans scénario d'exploitation reproductible ne va pas dans le rapport comme vulnérabilité : au mieux en « durcissement recommandé ».

### Phase 4 — Rapport

Classe par risque décroissant. Format par finding :

```
[CRITIQUE|HAUTE|MOYENNE|BASSE] — <titre> — <catégorie OWASP/CWE>
Confiance : CONFIRMÉ | À VÉRIFIER
Fichier : chemin:ligne
Exploitation : <la requête/entrée exacte et l'effet obtenu>
Cause racine : <pourquoi le code est vulnérable>
Correctif : <la correction concrète, idéalement le patch>
```

Barème de sévérité (impact × exploitabilité, esprit CVSS) :
- **CRITIQUE** : exécution de code, injection exploitable sans auth, secret de prod exposé, contournement d'auth, RCE via désérialisation/dépendance. → **bloque le merge**, dis-le en toute lettre.
- **HAUTE** : exploitable avec un compte (IDOR, élévation de privilège, SSRF vers le réseau interne, injection derrière auth, XSS stockée).
- **MOYENNE** : durcissement à impact réel (flag de cookie manquant, header de sécurité absent, message d'erreur bavard, rate-limit manquant sur l'auth, crypto faible sans exploit direct).
- **BASSE** : bonne pratique, défense en profondeur.

Termine par : (1) les catégories vérifiées **sans** finding (preuve de couverture, pas un « OK » sec), et (2) le rappel de périmètre — ce que cet audit ne couvre pas et vers quoi diriger (pentest, DAST, threat model).

## Règles

- **Ne corrige pas automatiquement** sauf demande explicite : audite, prouve, propose. Un correctif sécu mal posé (ex. filtre regex sur une injection) crée une fausse confiance.
- **Zéro faux positif toléré dans la section « vulnérabilités »** : le doute va en « à vérifier », jamais présenté comme certain.
- **Adapte-toi à la stack réelle** détectée en Phase 0. La CHECKLIST donne les motifs par écosystème ; n'applique pas un check Node à un projet Go.
- **Si ce dépôt est le projet UrbanFlow** (présence de `CLAUDE.md` + `src/server/`), applique en plus les invariants projet listés en fin de CHECKLIST.
