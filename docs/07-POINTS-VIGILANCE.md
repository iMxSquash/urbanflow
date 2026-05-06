# Points de vigilance — Ne pas perdre de points

## Erreurs fatales (éliminatoires ou quasi-éliminatoires)

### ❌ Prototype qui ne fonctionne pas en démo

Le planificateur doit afficher un itinéraire réel sur une carte en cliquant un bouton. Si ça plante, tout le dossier est fragilisé.

**Mitigation** : mode démo avec fichiers JSON pré-enregistrés. Scénario de démo testé et re-testé avant la soutenance.

### ❌ PWA non installable

C1 est une contrainte binaire. Le manifest et le service worker doivent être détectés par Chrome. Tester l'installation sur Android au moins une fois.

**Mitigation** : `vite-plugin-pwa` génère automatiquement le manifest et le SW. Vérifier avec l'onglet Application des DevTools Chrome.

### ❌ Aucune mention de RGPD

Les données de géolocalisation sont des données personnelles sensibles. Le dossier DOIT mentionner :
- Consentement avant activation GPS
- Durée de conservation des données
- Droit à l'effacement
- Pas de partage à des tiers

---

## Points souvent oubliés

### ⚠️ Accessibilité (C7, C12) — Ce n'est PAS un bonus

Contraintes listées explicitement dans le sujet. Un score Lighthouse accessibility < 70 sera visible en revue de code.

Quick wins :
- Attributs `alt` sur toutes les images
- Contrastes WCAG AA (ratio ≥ 4.5:1 pour le texte normal)
- Navigation clavier fonctionnelle
- Labels sur tous les champs de formulaire
- `aria-label` sur les boutons icône
- Tester avec Axe DevTools (extension Chrome gratuite)

### ⚠️ Descriptions des diagrammes UML

Le sujet dit explicitement « une description devra être appliquée à chacun ». Un diagramme sans texte = points perdus. Chaque diagramme doit avoir **au minimum 10-15 lignes de description** expliquant :
- Les acteurs/objets impliqués
- Les flux principaux
- Les choix de modélisation

### ⚠️ Éco-conception : des métriques, pas des mots

Ne jamais écrire « nous avons fait attention à l'éco-conception » sans chiffres.

Métriques à fournir :
- Poids du bundle (ko gzip) → `vite-bundle-visualizer`
- Score Lighthouse Performance
- Nombre de requêtes HTTP par page
- Choix de Leaflet (40 ko) vs Google Maps SDK (200+ ko)
- Hébergement CDN + mise en veille auto (argument quantifiable)

### ⚠️ Le scoring « IA » — Ne pas survendrer

L'algorithme est un système de pondération à règles. C'est parfaitement valable.

Dans le dossier, l'appeler : **« moteur d'optimisation basé sur un scoring multicritères »**.

Si un juré demande « c'est quoi l'IA là-dedans ? » :

> « Le terme IA dans le cahier des charges désigne ici un système décisionnel adaptatif. Notre scoring intègre les préférences utilisateur, les conditions météo et les émissions CO2 pour personnaliser chaque résultat. Nous avons privilégié un algorithme déterministe plutôt qu'un modèle ML pour des raisons d'éco-conception (C5) et de transparence décisionnelle. »

---

## Risques techniques identifiés

### 🔴 Quota / disponibilité Transitous

Transitous est un service communautaire best-effort. L'API peut être lente ou indisponible.

**Mitigation** : mode démo avec JSON pré-enregistrés. Fallback automatique si API timeout > 5s.

### 🔴 Expiration contrat Bicloo/JCDecaux (2026)

L'API GBFS Bicloo pourrait changer ou disparaître pendant le projet.

**Mitigation** : données vélos mockées en mode démo. Couche d'abstraction pour substituer le fournisseur.

### 🟡 Diagramme de communication vs activité

Le sujet demande explicitement un diagramme de communication. Si tu le remplaces, prépare la justification. Option la plus sûre : faire les deux.

### 🟡 Lighthouse CI instable sur GitHub Actions

Les runners partagés GitHub ont des performances CPU variables. Les scores Lighthouse peuvent varier de ±20 points entre deux runs sans changement de code.

**Mitigation** : exécuter Lighthouse manuellement en local au Sprint 5. Captures d'écran pour le dossier.

---

## Quick wins pour la soutenance

### ✅ Score Lighthouse en annexe

Une capture d'écran Lighthouse avec 4 scores verts (Performance, Accessibility, Best Practices, PWA) vaut mille mots. C'est 30 secondes à produire et ça prouve C1, C5, C7, C10.

### ✅ Swagger accessible en live

Ouvrir `/api-docs` pendant la démo pour montrer l'API exposée = preuve instantanée de C9.

### ✅ Toggle carte éco

Un toggle sur la carte qui colore les itinéraires vert→rouge selon leur score CO2. 20 lignes de Leaflet, zéro backend supplémentaire, visuellement puissant.

### ✅ Mention de la contribution open data

Si tu as contacté Nantes Métropole pour le SIRI et/ou aidé Transitous, mentionne-le en conclusion du dossier. Ça sort du lot.

---

## Checklist avant soutenance

- [ ] PWA installable sur Android/Chrome
- [ ] Démo mode fonctionne offline (JSON statiques)
- [ ] Scénario « beau temps → vélo favorisé » prêt
- [ ] Scénario « pluie → TC favorisé » prêt
- [ ] Score Lighthouse ≥ 85 sur les 4 axes (capture)
- [ ] Swagger `/api-docs` accessible
- [ ] 0 erreur critique Axe DevTools
- [ ] Bundle < 300 ko gzip (capture vite-bundle-visualizer)
- [ ] Dossier PDF relu, 40 pages, pas de fautes
- [ ] Soutenance répétée en < 15 min
