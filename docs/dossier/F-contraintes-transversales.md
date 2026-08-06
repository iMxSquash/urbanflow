# Phase F : Contraintes transversales C1-C12

Les douze contraintes officielles du projet traversent l'ensemble de la solution sans se cantonner à un seul module fonctionnel. Cette section les traite comme un référentiel de conformité : pour chaque contrainte, l'équipe indique ce qui est prévu au périmètre, pourquoi l'approche retenue est la plus appropriée, et quelle preuve vérifiable en atteste.

---

## Tableau de synthèse

| # | Contrainte | Réponse au périmètre MVP | Preuve |
|---|---|---|---|
| C1 | PWA installable | `vite-plugin-pwa` : manifest + service worker, installation depuis le navigateur | Capture d'écran de l'invite d'installation |
| C2 | Responsive et UX | Tailwind mobile-first, design system UrbanFlow (mode clair et sombre), 5 écrans validés en maquette | Maquettes Figma |
| C3 | Normes et standards | TypeScript strict, ESLint, conventions REST, standards transport GTFS/GBFS | Extrait config ESLint + Swagger |
| C4 | Sécurité OWASP | Helmet, rate-limit, CORS, Zod, bcrypt, JWT HttpOnly | Extrait `server/index.ts` (empilement middleware) |
| C5 | Éco-conception | Bundle < 300 ko gzip, lazy loading des routes, Leaflet 40 ko, cache météo 10 min | Rapport `vite-bundle-visualizer` |
| C6 | Géolocalisation | Consentement explicite, géoloc navigateur, fallback saisie manuelle | Capture écran consentement |
| C7 | Accessibilité WCAG 2.1 AA | Contrastes >= 4.5:1, navigation clavier, `alt`, `aria-label`, `role=application` | Audit Axe DevTools : 0 erreur bloquante |
| C8 | RGPD | Consentement géoloc, `DELETE /api/auth/me`, rétention 12 mois, zéro partage GPS | Capture écran consentement + extrait endpoint |
| C9 | Interopérabilité | API REST OpenAPI 3.0 (Swagger), pattern Stratégie (TransportProvider), GTFS/GBFS/GeoJSON | Page `/api/docs` |
| C10 | Performances mobilité | Cache Zustand, service worker offline, `Promise.all()`, Lighthouse > 90 en performance | Rapport Lighthouse |
| C11 | Sécurité des données de déplacement | HTTPS obligatoire, authentification JWT sur toutes les routes de données, minimisation | Config Helmet + Render HTTPS forcé |
| C12 | Normes accessibilité transport | Filtre PMR, seuil marche 5 min, pénalité vélo PMR (conformité des arrêts : reportée en V2) | Extrait `scoring.service.ts` |

---

## C1. PWA installable

La contrainte impose une application installable sur terminal mobile sans passer par un store. La solution utilise `vite-plugin-pwa`, qui génère automatiquement le fichier manifest (nom, icônes, couleur de thème, mode d'affichage `standalone`) et le service worker au moment du build.

L'installation est proposée par le navigateur via une bannière native déclenchée par le manifest. Aucune démarche supplémentaire n'est requise de la part de l'utilisateur sur Android. Sur iOS Safari, la procédure est guidée par un message contextuel affiché une seule fois.

Le service worker met en cache l'app shell (HTML, CSS, JavaScript, polices) et les tuiles cartographiques déjà consultées. La stratégie retenue est "stale-while-revalidate" pour l'app shell : l'interface se charge depuis le cache sans attendre le réseau, puis se met à jour silencieusement. Le calcul d'un nouvel itinéraire reste dépendant des APIs de routage : ce cas est hors périmètre offline en MVP et documenté comme tel dans la section Contexte.

> **[À CRÉER]** _Capture d'écran_ : invite d'installation PWA sur mobile Android Chrome (bannière "Ajouter à l'écran d'accueil") et icône sur l'écran d'accueil après installation.

---

## C2. Responsive et expérience utilisateur

TailwindCSS impose une discipline mobile-first : toute classe sans préfixe s'applique au mobile, les préfixes `md:` et `lg:` étendent la mise en page aux écrans plus larges. Aucune mise en page n'est conçue pour desktop puis adaptée : le point de départ est systématiquement le viewport mobile (375 px).

Le design system UrbanFlow définit les tokens de couleur pour un mode clair et un mode sombre, ainsi que les composants réutilisables (boutons, cartes d'itinéraire, bottom navigation). Ces tokens sont déclarés dans `@theme` de `src/client/index.css` et génèrent automatiquement les classes Tailwind correspondantes. La cohérence visuelle est ainsi garantie structurellement, sans duplication de valeurs hexadécimales dans les composants.

Cinq écrans constituent le parcours principal validé en maquette : carte (page d'accueil), planificateur (formulaire de recherche), résultats, profil utilisateur et tableau de bord de mobilité.

---

## C3. Normes et standards

**TypeScript strict.** L'option `"strict": true` dans `tsconfig.json` active la totalité des vérifications statiques : nullabilité, types de retour inférés, interdiction implicite de `any`. Toute erreur de type est bloquante à la compilation, non au runtime.

**ESLint.** Un fichier de configuration `eslint.config.js` (format flat config ESLint 9) applique les règles recommandées de `typescript-eslint`, avec des surcouches strictes propres au projet (`@typescript-eslint/no-explicit-any` et `@typescript-eslint/consistent-type-imports` en erreur bloquante sur le client, le serveur et le code partagé). Le pipeline GitHub Actions exécute ce lint à chaque pull request ; aucun merge n'est autorisé avec des avertissements actifs sur les fichiers modifiés.

**Conventions REST.** Les routes de l'API respectent les conventions REST : noms de ressources au pluriel, verbes HTTP sémantiques (`POST` pour la création, `DELETE` pour la suppression), codes de statut HTTP normalisés. Le contrat de l'API est documenté en OpenAPI 3.0 via Swagger (voir C9).

**Standards transport.** La solution consomme et respecte les standards ouverts du secteur : GTFS (General Transit Feed Specification, format ouvert de données TC statiques) via Transitous, GBFS (General Bikeshare Feed Specification, standard vélos en libre-service) pour les stations Bicloo, et GeoJSON (format ouvert d'échange de données géographiques) pour la géométrie des segments. Ces standards sont détaillés dans la section Architecture.

> **[À CRÉER]** _Capture d'écran_ : log du job "lint" au vert dans l'onglet Actions de GitHub, sur le dernier push de `main`. Le fichier de configuration `eslint.config.js` est déjà versionné dans le dépôt et peut être joint tel quel en complément.

---

## C4. Sécurité OWASP

La couche de sécurité est organisée en middleware transversal, appliqué en amont de toutes les routes sans exception.

**Helmet.** Le middleware Helmet positionne les en-têtes HTTP de sécurité sur chaque réponse : `Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Strict-Transport-Security`. Ces en-têtes couvrent les vecteurs d'attaque XSS (Cross-Site Scripting) par injection de scripts tiers et de clickjacking.

**Rate limiting.** Un limiteur de débit (100 requêtes par fenêtre de 15 minutes par adresse IP) protège les endpoints d'authentification contre les attaques par force brute. La configuration est plus restrictive sur les routes `/api/auth/login` et `/api/auth/register` que sur les routes de données.

**CORS.** La politique d'origine croisée n'autorise que l'origine du frontend (`CORS_ORIGIN` configuré en variable d'environnement). Le middleware `cors` n'émet pas de code d'erreur : une origine non autorisée ne reçoit simplement pas les en-têtes `Access-Control-Allow-*` sur la réponse, ce qui empêche un navigateur tiers d'exploiter cette réponse depuis une page web. Un client non-navigateur (script, `curl`) reçoit la réponse normalement, car CORS est une protection appliquée par le navigateur, pas par le serveur. La protection réelle des données repose sur l'authentification JWT présentée en fin de section, pas sur CORS seul.

**Validation Zod.** Toutes les entrées utilisateur (corps de requête, paramètres de route) passent par un middleware Zod avant d'atteindre le controller. La validation retourne un code 400 structuré (`{ error: string, details: ZodError }`) en cas d'entrée invalide. Aucune entrée non validée n'atteint la logique métier.

**Authentification et hashage.** Les mots de passe sont hachés avec bcrypt (minimum 10 rounds). Les tokens JWT (JSON Web Token) d'accès ont une durée de vie de 15 minutes. Le refresh token est transmis uniquement via un cookie HttpOnly, Secure et SameSite=Strict, ce qui protège contre les attaques XSS (le JavaScript de la page ne peut pas lire le cookie) et CSRF (Cross-Site Request Forgery). Aucun token n'est stocké dans `localStorage`.

L'empilement est déclaré en tête de `src/server/index.ts`, avant le montage de toute route applicative :

```typescript
app.set('trust proxy', 1)

const globalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Trop de requêtes, réessayez plus tard' },
})

app.use(helmet())
app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }))
app.use(globalRateLimit)
app.use(express.json())
app.use(cookieParser())
```

---

## C5. Éco-conception

L'éco-conception est une contrainte de conception, pas un ajout a posteriori. Elle se traduit par quatre règles appliquées à chaque décision technique.

**Bundle frontend inférieur à 300 ko gzip.** Mesure sur le build de référence (`npm run build`) : le bundle JavaScript et CSS complet totalise environ 247 ko gzip, sous la cible de 300 ko. Le poste le plus lourd est le chunk `vendor` (React 18, React Router, Zustand : 134 ko gzip), suivi du chunk cartographique Leaflet (43 ko gzip) et de `MapPage` (18 ko gzip, page la plus dense de l'application). Les graphiques du tableau de bord (répartition CO2 hebdomadaire, répartition par mode) sont implémentés en SVG natif plutôt qu'avec une bibliothèque de charting tierce, ce qui évite d'ajouter Recharts ou équivalent au bundle. Les bibliothèques volumineuses sans alternative légère équivalente sont exclues du périmètre (Google Maps SDK : plus de 200 ko).

**Lazy loading des routes.** Chaque page React est chargée via `React.lazy` et `Suspense`. L'utilisateur ne télécharge que le code de la page sur laquelle il se trouve. Les pages peu fréquentées (tableau de bord, paramètres) ne sont chargées qu'à la première navigation.

**Cache météo.** Les données OpenWeatherMap sont mises en cache en mémoire côté serveur (Map JavaScript, TTL de 10 minutes) pour éviter les appels redondants sur des requêtes portant sur le même secteur géographique dans la même fenêtre de temps. Ce cache réduit le nombre d'appels réseau et la latence de scoring, comme décrit dans la section Pilotage.

**Réduction des images et ressources.** Les images de l'interface sont servies au format WebP lorsque possible. Les icônes de transport sont des pictogrammes SVG inline (zéro requête HTTP supplémentaire).

> **[À CRÉER]** _Rapport de bundle_ : capture du rapport interactif `vite-bundle-visualizer` (`npx vite-bundle-visualizer` après `vite build`) montrant le détail par chunk, en complément des chiffres globaux déjà mesurés ci-dessus.

---

## C6. Géolocalisation

La géolocalisation du navigateur est utilisée uniquement pour préremplir le champ "départ" dans le planificateur. Elle n'est jamais activée en arrière-plan ni conservée côté serveur au-delà de la durée de la requête de calcul.

**Consentement explicite.** Avant toute activation de l'API de géolocalisation, une modale d'information s'affiche : elle explique l'usage prévu (préremplir l'adresse de départ), la durée de traitement (non conservé), et présente deux options explicites ("Autoriser pour ce trajet" et "Saisir manuellement"). Le refus n'entraîne aucune dégradation fonctionnelle : le champ reste éditable. Ce comportement est lié à la contrainte C8 et détaillé dans la section consacrée aux spécifications du planificateur multimodal.

**Fallback saisie manuelle.** Si l'utilisateur refuse la géolocalisation, si le navigateur ne prend pas en charge l'API, ou si la précision GPS est insuffisante (contexte indoor, tunnel), le champ "départ" reste vide et editable. L'interface n'infère pas la position par d'autres moyens (adresse IP, données réseau) : cela constituerait un traitement de données de localisation sans consentement explicite.

> **[À CRÉER]** _Capture d'écran_ : modale de consentement géolocalisation affichée avant l'activation de l'API, sur mobile, avec les deux boutons d'action visibles.

---

## C7. Accessibilité WCAG 2.1 AA

L'accessibilité est vérifiée sur les cinq écrans du parcours principal avec Axe DevTools (extension Chrome), outil de référence pour l'audit WCAG (Web Content Accessibility Guidelines) 2.1 niveau AA. L'objectif est zéro erreur bloquante détectée par Axe sur l'ensemble de ces écrans.

**Contrastes.** La palette UrbanFlow est déclinée en mode clair et en mode sombre, chacun construit pour que le ratio de contraste entre le texte et le fond dépasse 7:1 pour le texte principal et 4.5:1 pour le texte secondaire, dans les deux modes. Ces valeurs dépassent le seuil WCAG AA (4.5:1 pour le texte normal).

**Navigation clavier.** Chaque élément interactif (boutons, liens, champs de formulaire, options de modes de transport) est atteignable et activable au clavier dans un ordre logique. Le focus visible est explicitement stylisé via les classes Tailwind `focus:ring` pour ne jamais être masqué.

**Attributs ARIA et alternatives textuelles.** Tout bouton sans libellé textuel visible porte un attribut `aria-label`. Chaque icône de mode de transport est accompagnée d'un texte alternatif ou d'un span `sr-only` (screen-reader only) lisible par les lecteurs d'écran. La carte Leaflet porte les attributs `role="application"` et `aria-label="Carte des itinéraires Nantes Métropole"` pour signaler aux technologies d'assistance qu'il s'agit d'une zone interactive non standard. Chaque champ de formulaire est associé à son label via `htmlFor` et `id`.

> **[À CRÉER]** _Capture d'écran_ : panneau Axe DevTools sur la page planificateur en état "résultats affichés", montrant 0 violation bloquante. À prendre depuis Chrome DevTools après lancement du prototype.

---

## C8. RGPD

Le traitement des données personnelles suit les principes de minimisation et de transparence du RGPD (Règlement Général sur la Protection des Données).

**Consentement géolocalisation.** Le mécanisme est décrit en C6. Aucune position GPS n'est collectée ni transmise au backend sans que l'utilisateur ait activement accepté pour la session en cours. En complément du consentement local (Zustand persist, source de vérité pour l'UX), l'acceptation déclenche un appel `POST /api/auth/consent` qui horodate `users.rgpd_consent_at` côté serveur — trace nécessaire à l'accountabilité prévue par l'article 5.2 du RGPD (pouvoir démontrer qu'un consentement a été recueilli).

**Droit à l'effacement.** L'endpoint `DELETE /api/auth/me` supprime en cascade l'ensemble des enregistrements liés au compte : profil, historique de trajets, points, badges et récompenses échangées. La suppression est irréversible et effective immédiatement en base de production. Les sauvegardes techniques de l'hébergeur restent un cas distinct : Supabase ne réalise pas de sauvegarde ciblée par utilisateur mais des instantanés de l'ensemble de la base, dont la rétention suit la politique de l'hébergeur et n'est pas pilotable par une requête applicative. Cette rétention technique globale, de l'ordre de quelques jours selon le plan souscrit, correspond à la tolérance admise par la CNIL (Commission Nationale de l'Informatique et des Libertés) pour les sauvegardes de sécurité : l'obligation d'effacement porte sur les traitements actifs, pas sur les copies de sécurité destinées à la seule reprise après incident.

**Droit à la portabilité.** L'endpoint `GET /api/auth/me/export` (art. 20 du RGPD) retourne un fichier JSON téléchargeable contenant l'ensemble des données personnelles du compte connecté : informations de compte, profil de mobilité, historique complet des trajets, badges débloqués et récompenses échangées. Il est accessible depuis l'écran Paramètres et, en sortie de secours, depuis la modale de suppression de compte — un utilisateur peut ainsi récupérer ses données juste avant de les effacer définitivement.

**Durée de conservation.** Les enregistrements des tables `trips` et `reward_redemptions` sont supprimés automatiquement après 12 mois. Un job planifié (`node-cron`, `src/server/jobs/purge-old-trips.job.ts`) exécute cette purge quotidiennement à 3h15 (heure de Paris), en dehors des heures de pointe. La durée de 12 mois est justifiée par la nécessité de calculer les statistiques annuelles de mobilité affichées dans le tableau de bord citoyen.

**Zéro partage GPS.** Les coordonnées de départ et d'arrivée d'un trajet sont transmises du client vers le backend uniquement pour le calcul de l'itinéraire, le temps de la requête. Elles ne sont pas transmises aux APIs de transport dans leur forme brute : Transitous et OSRM reçoivent des coordonnées arrondies à 4 décimales (précision de l'ordre de 10 mètres). La minimisation va plus loin que le simple non-partage : la table `trips` ne conserve aucune coordonnée GPS en base — seuls les modes de transport utilisés, le CO2 économisé et les points gagnés sont persistés, données qui ne permettent pas de reconstituer un trajet réel. Aucune donnée de géolocalisation n'est partagée avec des tiers à des fins commerciales ou analytiques. Cette règle porte sur les coordonnées de recherche transmises au backend ; elle est distincte du chargement des tuiles cartographiques CartoDB par le navigateur, appel client direct documenté comme exception dans la section consacrée à l'architecture technique.

**Absence de pages légales dédiées.** Le projet ne propose pas de pages Mentions légales / CGU / Politique de confidentialité distinctes : l'ensemble des informations RGPD (finalités, droits, consentement, conservation) est regroupé dans l'écran Paramètres. Ce choix est assumé pour un prototype académique sans traitement commercial, sans cookies tiers et sans mise en production réelle destinée au grand public — la CNIL n'impose pas de gabarit de pages spécifique tant que l'information est accessible et complète. Une mise en production réelle nécessiterait de les extraire dans des pages dédiées.

> **[À CRÉER]** _Capture d'écran_ : écran de paramètres utilisateur avec le bouton "Supprimer mon compte" visible, et la modale de confirmation avant suppression.

---

## C9. Interopérabilité

La solution ne se contente pas de consommer des APIs : elle expose la sienne. Cette double posture est la traduction technique de la contrainte d'interopérabilité.

**API REST documentée via Swagger.** Le backend expose l'ensemble de ses endpoints via une page OpenAPI 3.0 accessible à `/api/docs`. Cette documentation est générée automatiquement depuis les annotations `swagger-jsdoc` présentes dans le code source. Elle décrit les schémas de requête, les schémas de réponse et les codes d'erreur pour chaque endpoint. Les systèmes d'information tiers de Nantes Métropole peuvent consommer l'API sans accès au code source.

**Pattern Stratégie.** L'interface `TransportProvider` est elle-même un contrat d'interopérabilité interne : tout provider de transport conforme à cette interface est immédiatement intégrable sans modifier le module de routage. Ce mécanisme est détaillé dans la section Architecture.

**Standards de données de transport.** La solution s'appuie sur les standards ouverts du secteur transport (GTFS, GBFS, SIRI-Lite, GeoJSON), tous définis dans la section Architecture. Ces standards garantissent la portabilité de la solution vers d'autres collectivités disposant d'un flux GTFS ou GBFS ouvert.

> **[À CRÉER]** _Capture d'écran_ : page Swagger UI (`/api/docs`) affichant la liste des endpoints avec leurs schémas déployés. À prendre depuis le navigateur après démarrage du serveur en local.

---

## C10. Performances mobilité

Les performances en contexte de mobilité sont contraintes par deux réalités : la connectivité réseau variable et la puissance limitée des terminaux d'entrée de gamme.

**Parallélisation des appels.** Comme décrit dans la section Pilotage, `routing.service.ts` lance les appels à `TransitousProvider` et `OsrmProvider` simultanément via `Promise.all()`. Cette mesure ramène le p95 de calcul d'itinéraire sous la cible de 2 secondes, contre un p95 estimé à plus de 3 secondes en appels séquentiels.

**Cache Zustand.** Les données déjà chargées (profil utilisateur, résultats de la dernière recherche, badges) sont conservées dans le store Zustand côté client. Un composant qui accède à ces données ne déclenche pas de nouvel appel réseau si les données sont déjà présentes. La durée de vie du cache Zustand correspond à la session de navigation.

**Service worker offline.** L'app shell est servi depuis le cache du service worker, ce qui rend la première interaction visible en moins de 1 seconde même sur réseau 3G. Les tuiles cartographiques déjà consultées sont également mises en cache, permettant à l'utilisateur de consulter la carte d'un trajet déjà calculé sans connexion.

**Cible Lighthouse.** Le score de performance Lighthouse cible est supérieur à 90 sur mobile (simulation de réseau 4G lente, CPU x4). Ce seuil couvre les terminaux d'entrée de gamme qui constituent une fraction significative de la base utilisateurs visée.

> **[À CRÉER]** _Rapport Lighthouse_ : capture du rapport Lighthouse DevTools (onglet Performance) sur la page planificateur, score >= 90, simulé en mobile 4G. À prendre depuis Chrome DevTools en mode navigation privée.

---

## C11. Sécurité des données de déplacement

Les données de déplacement (coordonnées GPS, historique de trajets) sont des données personnelles sensibles. La sécurité de leur traitement repose sur trois principes.

**Chiffrement en transit.** Toutes les communications entre le client et le backend transitent exclusivement en HTTPS. Le certificat TLS est géré automatiquement par Render (backend) et Vercel (frontend). Helmet positionne l'en-tête `Strict-Transport-Security` pour forcer le navigateur à rejeter toute connexion HTTP non sécurisée, même si l'URL est saisie sans le préfixe `https://`.

**Accès authentifié.** Chaque endpoint exposant ou acceptant des données de déplacement est protégé par le middleware JWT Guard. Un token d'accès valide (15 minutes de durée de vie) est requis pour accéder à `POST /api/routing/journeys`, `GET /api/journeys/history` et `DELETE /api/auth/me`. Sans token, la réponse est un code 401 sans contenu applicatif.

**Minimisation.** Les coordonnées GPS transmises aux providers de transport sont arrondies à 4 décimales. Les historiques de trajets ne conservent pas la géométrie détaillée des segments (liste de points du tracé) : seuls le point de départ, le point d'arrivée, la durée, la distance et le bilan CO2 sont persistés. La géométrie ne sert qu'à l'affichage immédiat et n'est pas stockée en base.

---

## C12. Normes d'accessibilité transport

Cette contrainte couvre l'accessibilité des personnes à mobilité réduite (PMR) dans le contexte spécifique du transport, au-delà de l'accessibilité numérique traitée en C7.

**Filtre PMR dans le profil.** L'utilisateur peut activer le mode PMR dans son profil de mobilité. Ce paramètre est persisté dans la table `mobility_profiles` (colonne `pmr_accessibility`) et transmis à chaque requête de calcul d'itinéraire via le champ `pmrAccessibility` du corps de requête.

**Seuil de marche réduit.** Quand le filtre PMR est actif, le seuil de tolérance pour les segments de marche est réduit à la valeur minimale entre la valeur configurée par l'utilisateur et 5 minutes. Tout itinéraire comportant un segment de marche supérieur à ce seuil est éliminé avant le calcul du score.

**Pénalités spécifiques dans le score de confort.** Le moteur de scoring applique des pénalités renforcées en mode PMR : 60 points de pénalité sur le score de confort pour un segment de marche dépassant le seuil (contre 40 en mode standard), et 50 points de pénalité supplémentaires si un segment vélo est présent dans l'itinéraire. Ces pénalités sont décrites en détail dans la section consacrée aux spécifications du planificateur multimodal.

**Compatibilité arrêts accessibles.** La couverture des données d'accessibilité des arrêts Naolib dépend des flux GTFS fournis par Semitan. La conformité des arrêts (quais surélevés, annonces sonores) n'est pas vérifiable directement depuis les données ouvertes disponibles en MVP. Ce point est documenté comme un axe d'amélioration V2, conditionné à un accord opérationnel avec Semitan pour l'accès aux données d'accessibilité des arrêts.

Le seuil de marche réduit est appliqué en filtre dur dans `routing.service.ts`, avant le scoring :

```typescript
// Filtre dur maxWalkMinutes : éliminer tout itinéraire dont un segment marche
// dépasse le seuil de l'utilisateur (PMR réduit ce seuil à 5 min).
const maxWalk = options.pmrAccessibility
  ? Math.min(options.maxWalkMinutes ?? 30, 5)
  : (options.maxWalkMinutes ?? 30)

const withWalkFilter = filtered.filter((j) =>
  j.segments.filter((s) => s.mode === 'walk').every((s) => s.durationMin <= maxWalk)
)
```

Les pénalités renforcées sont appliquées dans `computeComfortScore()` de `scoring.service.ts` :

```typescript
// Pénalité si un segment marche dépasse le seuil
if (maxWalkSeg > maxWalk) {
  // Pénalité plus sévère si PMR (−60) que pour un utilisateur standard (−40)
  base = Math.max(0, base - (pmr ? 60 : 40))
}

// PMR : pénalité supplémentaire si le trajet contient du vélo
if (pmr && segments.some((s) => s.mode === 'bike')) {
  base = Math.max(0, base - 50)
}
```
