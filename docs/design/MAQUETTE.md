# UrbanFlow SmartRoute — Guide de maquette
> Design système atomique complet · Mobile-first PWA · Direction créative "Estuaire"
>
> **Source de vérité : Claude Design.** Ce document transcrit le contenu du projet
> [Urbanflow design directions](https://claude.ai/design/p/f442a1d6-2613-40e4-a799-50f42376ca1c)
> (fichiers `Direction Créative.dc.html`, `1a Estuaire - Palette.dc.html`,
> `1a Estuaire - Espacement et rayons.dc.html`, `1a Estuaire - Écrans.dc.html`,
> `1a Estuaire - Écrans 2.dc.html`, `1a Estuaire - Desktop.dc.html`). En cas de
> divergence, le projet Claude Design fait foi — ce fichier n'est qu'une copie de travail
> synchronisée manuellement. Dernière synchronisation : 2026-08-02.

---

## Vision & Direction créative

**Concept : "Estuaire"** — sable et vert profond.

> « Une base papier chaude, un accent vert estuaire sourd, un bleu Loire pour le temps
> réel. Le calme d'Apple Plans avec une identité de service métropolitain — la carte
> reste le sujet, l'UI se retire. »

Trois directions ont été explorées en étape 1 (`Direction Créative.dc.html`) ; **Estuaire
(1a)** a été retenue et approfondie dans les fichiers suivants. Les deux autres,
gardées ici pour mémoire du choix :
- **Signal (1b)** — encre noire, vert signal, cobalt. Lisibilité plein soleil, contraste
  maximal, énergie "Waze sans le bruit". Police Space Grotesk.
- **Quai (1c)** — teal et terre cuite, direction éditoriale, chiffres en Instrument Serif,
  CO₂ raconté en équivalences concrètes plutôt qu'en grammes. Police Instrument Serif + Manrope.

> Le fichier source ne contient pas de justification écrite du choix d'Estuaire — seul
> le fait que tous les livrables suivants soient préfixés "1a Estuaire" en atteste.

**Principes directeurs de la direction Estuaire**
1. **La carte reste le sujet** — tout le flux carte/recherche/itinéraire tient dans un
   bottom sheet unique à 8 états ; aucun réglage n'ouvre un écran séparé.
2. **Rien n'est porté par la seule couleur** — chaque mode de transport garde son icône
   propre (WCAG 1.4.1), la marche est toujours en trait pointillé sur la carte.
3. **Aucune animation décorative** — pas de boucle, pas de parallaxe ; seules
   `transform`/`opacity` s'animent, jamais `height`/`top`/`box-shadow` (éco-conception +
   `prefers-reduced-motion`).
4. **Divulgation progressive** — les réglages avancés (horaire, PMR, marche max, dénivelé)
   restent repliés par défaut et s'ouvrent à la demande, jamais imposés.
5. **RGPD à poids visuel égal** — sur chaque choix sensible (géolocalisation, suppression
   de compte), les deux options ont le même poids visuel ; aucune n'est présélectionnée.

Police unique : **Instrument Sans** (400/500/600/700).

---

## 1. Fondations — Design Tokens

> Détail complet et code CSS dans [`DESIGN-SYSTEM.md`](./DESIGN-SYSTEM.md). Résumé ici.

### 1.1 Palette — mode clair (défaut)

#### Surfaces
| Token | Hex | Usage |
|-------|-----|-------|
| `bg` | `#F6F4EF` | Fond de page |
| `surface` | `#FFFFFF` | Cartes, panneaux |
| `surface-muted` | `#FBFAF7` | Fonds secondaires |
| `surface-sunken` | `#EDEAE2` | Zones creusées, skeleton |
| `border` | `#DCD7CB` | Bordures standard |
| `border-strong` | `#C7BFAF` | Bordures actives |

#### Texte (contrastes mesurés sur `surface`)
| Token | Hex | Contraste |
|-------|-----|-----------|
| `text` | `#14231D` | 14,9:1 |
| `text-muted` | `#47544D` | 7,1:1 |
| `text-subtle` | `#6B7A72` | 4,6:1 |
| `text-disabled` | `#8A9690` | — |

#### Vert primaire — action & éco (jamais utilisé pour autre chose)
| Token | Hex | Contraste |
|-------|-----|-----------|
| `primary` | `#0B5C43` | 8,0:1 |
| `primary-hover` | `#094B37` | — |
| `primary-surface` | `#E4EFE9` | — |
| `on-primary` | `#FFFFFF` | — |

#### Bleu transit (identifie le TC, jamais une action)
| Token | Hex | Contraste |
|-------|-----|-----------|
| `transit` | `#1D5E7A` | 6,1:1 |
| `transit-surface` | `#E7EEF2` | — |

#### Alerte / danger
| Token | Hex | Contraste | Usage |
|-------|-----|-----------|-------|
| `warning` | `#7A4A08` | 7,3:1 | État inhabituel (démo, trajet écarté, hors ligne, récompense expirée) — toujours icône + libellé |
| `danger` | `#B3261E` | 6,3:1 | Réservé exclusivement à la suppression de compte |

#### Couleurs par mode de transport (7 modes + voiture référence)
| Mode | Hex (trait/texte) | Contraste | CO₂ (ADEME) |
|------|--------------------|-----------|-------------|
| Marche | `#5B6B63` | 5,7:1 | 0 g/km |
| Vélo | `#0B5C43` (= primary) | 8,0:1 | 0 g/km |
| Trottinette | `#5C6E1A` | 5,3:1 | 0 g/km |
| Tramway | `#1D5E7A` (= transit) | 6,1:1 | 4 g/km |
| Bus | `#6B3F8F` | 7,6:1 | 109 g/km |
| Navibus | `#0F6B6B` | 5,9:1 | 50 g/km |
| Train | `#33449E` | 8,0:1 | 14 g/km |
| Voiture (référence, jamais sélectionnable) | `#C7BFAF` (hachures) | — | 253 g/km |

Règles : la marche est toujours en trait pointillé quelle que soit la teinte. Chaque
tracé porte un halo blanc/sombre de 2px pour la lisibilité sur les tuiles. Le vélo
partage volontairement la teinte `primary` — c'est le mode que le produit pousse. Les 7
teintes restent distinguables en deutéranopie/protanopie (spectre de luminance 5,3:1 à
8,0:1), mais l'icône reste toujours le vecteur d'information principal.

### 1.2 Mode sombre (surcharge `[data-theme="dark"]`)

| Rôle | Clair | Sombre |
|------|-------|--------|
| Fond de page | `#F6F4EF` | `#0D1512` |
| Surface | `#FFFFFF` | `#16211D` |
| Texte principal | `#14231D` (14,9:1) | `#EEF2EF` (16,6:1) |
| Primaire (vert) | `#0B5C43` (8,0:1) | `#4FCB9B` (8,3:1) |
| Transit (bleu) | `#1D5E7A` (6,1:1) | `#6BB6D6` (7,4:1) |

Table complète dans `DESIGN-SYSTEM.md`. Le mode sombre suit le même barème de contraste
WCAG AA/AAA que le mode clair, token par token.

### 1.3 Typographie

Police unique **Instrument Sans**. Chiffres en `tabular-nums` partout.

| Token | Taille | Poids | Usage |
|-------|--------|-------|-------|
| `display` | 44px | 700 | Chiffres clés (points, kg CO₂), tracking −0.03em |
| `titre` | 27px | 700 | Titres d'écran |
| `section` | 20px | 600 | Titres de section |
| `corps` | 16px | 400 | Corps principal (évite le zoom iOS) |
| `label` | 13px | 600 | Labels de champ, chips |
| `caption` | 12px | 400 | Jamais en dessous de cette taille |

### 1.4 Spacing (grille 4px, 8 paliers)

| Token | Valeur | Usage principal |
|-------|--------|-----------------|
| `space-1` | 4px | Gap bottom-nav, icône+coche |
| `space-2` | 8px | Gap chips, cartes de résultat |
| `space-3` | 12px | Gap vertical sheet, padding pill |
| `space-4` | 16px | Padding sheet mobile, marge écran |
| `space-5` | 20px | Header mobile, padding carte desktop |
| `space-6` | 24px | Gap entre blocs, padding modale |
| `space-8` | 32px | Padding vertical page desktop |
| `space-10` | 40px | Padding horizontal page desktop |

Constantes de layout : marge écran mobile 16px ; sheet `8px haut / 16px côtés / 12-14px
bas` ; pastilles flottantes carte à 14px du bord ; sidebar desktop 232px ; panneau
recherche desktop 400px (min 380) ; largeur de lecture max 1040px ; modale 520-560px.

### 1.5 Rayons de bordure

| Token | Valeur | Usage |
|-------|--------|-------|
| `radius-xs` | 6px | Checkboxes, mini pastilles de mode |
| `radius-sm` | 8px | Badges de segment, pastilles numérotées, barres de graphe |
| `radius-md` | 12px | Inputs, boutons secondaires, items de liste, boutons icône |
| `radius-lg` | 14px | Boutons primaires, nav actif, bandeaux d'alerte |
| `radius-xl` | 16px (18px desktop) | Cartes de résultat/contenu |
| `radius-2xl` | 24px | Bottom sheet (coins hauts), modales, cartes desktop |
| `radius-full` | 9999px | Chips mode/profil, toggles, avatars, poignée de sheet |

Règle d'imbrication : le rayon d'un enfant = rayon du parent − padding, arrondi au
palier inférieur en dessous. Une carte à liseré de mode gagne une bordure gauche 4px
colorée sans changer son rayon.

### 1.6 Tailles de contrôle (cibles tactiles)

| Token | Hauteur | Usage |
|-------|---------|-------|
| `control-xs` | 28px | Badges/toggles non interactifs |
| `control-sm` | 36px | Chips de mode en sheet mi-hauteur, bouton fermer |
| `control-md` | 40px | Chips de mode pleine taille, boutons icône desktop |
| `control-lg` | 44px | **Cible tactile minimum.** Chips profil, boutons icône flottants carte |
| `control-xl` | 48px | Champs de saisie, lignes de réglage, boutons secondaires |
| `control-2xl` | 52px | Action principale de l'écran (une seule par vue) |

En desktop, les cibles non-CTA se réduisent à 38px ; les CTA primaires gardent leur
taille mobile.

### 1.7 Icônes

Un seul jeu, `viewBox 0 0 24 24`, extrémités et jonctions arrondies (`round`
linecap/linejoin), aucun remplissage sauf le marqueur de destination. Épaisseur de trait
constante à poids optique égal : 1,75px (icônes 20-26px), 1,9-2px (15-18px), 2,2-2,6px
(12-13px). Pastilles d'icône : 30/34/40/46px, rayon pill ou 12px.

> La bibliothèque exacte (Lucide ou custom) n'est pas précisée dans les fichiers Claude
> Design — à vérifier que les icônes Lucide déjà utilisées respectent bien ces règles de
> trait avant réutilisation telles quelles.

### 1.8 Élévation (3 niveaux, pas plus)

| Token | Clair | Sombre |
|-------|-------|--------|
| `shadow-card` | `0 2px 12px rgba(20,35,29,.06)` | `0 2px 12px rgba(0,0,0,.28)` |
| `shadow-sheet` | `0 -6px 28px rgba(20,35,29,.14)` | `0 -6px 28px rgba(0,0,0,.40)` |
| `shadow-modal` | `0 20px 60px rgba(20,35,29,.35)` | `0 20px 60px rgba(0,0,0,.45)` |

Toute autre séparation visuelle passe par une bordure 1px. Pas de glassmorphism ni de
`backdrop-filter` dans cette direction — contrairement à l'ancienne direction "Urban
Night".

### 1.9 Mouvement

| Token | Valeur | Usage |
|-------|--------|-------|
| `dur-fast` | 120ms | Changement d'état d'un contrôle |
| `dur-base` | 180ms | Apparition de modale |
| `dur-sheet` | 200ms | Transition de position du bottom sheet |
| `ease-ui` | `cubic-bezier(0,0,.2,1)` | Toutes les transitions |

Seules `transform`/`opacity` s'animent. `prefers-reduced-motion: reduce` force toutes
les durées à 0ms. **Aucune animation décorative, boucle ou parallaxe** — ce qui exclut
par exemple un anneau GPS qui pulserait en continu ; préférer une pulsation unique au
changement d'état, ou un marqueur statique.

---

## 2. Atomes

| Atome | Spécification |
|-------|---------------|
| **Bouton primaire** | `control-2xl` (52px), `radius-lg`, fond `primary`, texte `on-primary` 16/600. Une seule instance par écran. |
| **Bouton secondaire** | `control-xl` (48px), `radius-md`, fond transparent, bordure `border-strong`. |
| **Bouton icône** | `control-lg` (44px) mobile / `control-md` (40px) desktop, `radius-md`, fond `surface`, `shadow-card`. |
| **Input texte** | `control-xl` (48px), `radius-md`, fond `surface`, texte 16px (anti-zoom iOS), focus = `focus-ring`. |
| **Chip de mode** | `control-md`/`control-sm` selon contexte, `radius-full`, icône + libellé, état sélectionné = bordure 1,5px + fond `mode-surface`. |
| **Chip éco (CO₂)** | Barre de comparaison vs voiture avec motif hachuré pour la référence, jamais de couleur seule. |
| **Badge de déblocage** | Bordure verte + date, grille 2 colonnes dans l'écran Badges. |
| **Toggle** | `radius-full`, ex. "Trajet accessible (PMR)", "Éviter le dénivelé". |
| **Skeleton** | Dégradé `surface-sunken` ↔ `surface-muted`, `radius-sm`, shimmer 1,5s (exempté de `prefers-reduced-motion`). |

---

## 3. Molécules

| Molécule | Spécification |
|----------|----------------|
| **Barre de recherche flottante** | "Où allez-vous ?" (placeholder), tag "Autour de moi", radiogroup profils Éco/Rapide/Équilibré. |
| **Champs Départ/Arrivée + autocomplete** | `role="combobox"`+`listbox`, debounce 300ms, `role="status"` annonce le nombre de résultats, section "Récents". |
| **Sélecteur horaire** | Radiogroup "Partir à"/"Arriver avant" + horloge. |
| **Carte de résultat** | Badge "Recommandé" optionnel, durée + CO₂ évité en tête, barre CO₂, chips de segments enchaînés, CTA. |
| **Segment de trajet (détail)** | Chevron dépliable, icône de mode, infos contextuelles (station Bicloo + vélos dispo, prochains passages TC, temps d'attente en badge ambré). |
| **Stat card (dashboard)** | Valeur `display` + libellé, tabular-nums. |
| **Item de bottom nav / sidebar** | Icône + libellé, `aria-current="page"` sur l'actif. |
| **Bandeau météo/alerte** | Icône + texte, jamais de couleur seule (ex. "Averses prévues à 15:10"). |
| **Toast de confirmation** | `role="status"` `aria-live="polite"`, ex. "Ticket TAN échangé · −400 pts · solde 840 pts". |

---

## 4. Organismes

| Organisme | Spécification |
|-----------|----------------|
| **Bottom sheet unique (mobile)** | 8 états (voir §5) dans un seul composant, jamais d'écran séparé pour les réglages. `role="dialog"` non modal, focus rendu au déclencheur à la fermeture, Échap replie d'un cran. |
| **Panneau latéral (desktop ≥1024px)** | Remplace le bottom sheet : `aside` fixe 400px (min 380), sections empilées sans overlay ni divulgation progressive — tout est visible en même temps. |
| **Bottom navigation (mobile) / Sidebar (desktop)** | 4 items mobile (Carte/Progrès/Récompenses/Profil) → sidebar 232px desktop avec libellés + Paramètres + bloc utilisateur en pied. |
| **Carte Leaflet** | `role="application"`, `aria-label="Carte de mobilité de Nantes"`. Voir §7. |
| **Grille de badges** | 2 colonnes, débloqués (bordure verte + date) vs en cours (barre de progression). |
| **Tableau de répartition par mode** | Tableau HTML natif, pas de graphique image — "le tableau est le graphique" (a11y). |

---

## 5. Écrans

> Trajet de démo utilisé sur toutes les maquettes : **Commerce → Chantrerie/Polytech**,
> 14:32→14:55, vélo+tram+marche, −1,18 kg CO₂, 85 pts, badge "10 trajets vélo".

### 5.1 Authentification & onboarding

| Écran | Contenu |
|-------|---------|
| **Connexion / Inscription** | Header vert 196px (logo + "UrbanFlow" + "Itinéraires multimodaux à Nantes Métropole"), tabs Connexion/Inscription, champs email/mot de passe, "Rester connecté", "Mot de passe oublié", bandeau RGPD, bouton "Continuer sans compte" (app utilisable, gamification perdue). |
| **Consentement géolocalisation** | Modale pleine largeur, "Utiliser votre position pour ce trajet ?", 3 garanties RGPD, boutons "Autoriser pour ce trajet" / "Saisir mon départ manuellement" à **poids visuel égal**, aucun présélectionné. |
| **Onboarding préférences + PWA** | Progression "Étape 2 sur 2", profil par défaut (Éco sélectionné), chips de modes, bandeau "Installer UrbanFlow · Accès hors-ligne · 1,2 Mo", bouton "Commencer". |

### 5.2 Flux carte / recherche / itinéraire (bottom sheet unique, 8 états)

| # | État | Hauteur sheet | Contenu clé |
|---|------|----------------|--------------|
| 1 | **Replié** | 212px | "Où allez-vous ?", tag "Autour de moi", profils Éco (actif)/Rapide/Équilibré, badge flottant "Stations Bicloo · 12 à proximité". |
| 2 | **Saisie + autocomplete** | plein écran | Départ ("Ma position · Commerce") / Arrivée (focus), inverser. `role="status"`: "3 adresses trouvées". Listbox 3 suggestions + "Récents". Aide clavier : "↑↓ pour parcourir · Entrée pour choisir · Échap pour revenir à la carte". |
| 3 | **Mi-hauteur (A→B renseigné)** | ~52% | Chips modes (Marche/Vélo/Tram actifs), "Réglages avancés" résumés inline ("Partir maintenant · 15 min de marche"), "3 itinéraires · calcul déterministe". |
| 4 | **Étendu (réglages)** | haut−140px | "Partir à"/"Arriver avant" + horloge, toggle PMR OFF ("Marche ≤ 5 min · segments vélo écartés"), slider marche max 15min (5-25), toggle "Éviter le dénivelé" ON, "Réinitialiser"/"Appliquer". |
| 5 | **Résultats (3 propositions)** | haut−172px | Carte 1 recommandée (−1,18kg/23min, barre CO₂ 9%), Carte 2 "Plus rapide" (19min/−0,94kg/1,70€), Carte 3 "Confortable · 0 changement" (27min/−1,02kg). |
| 6 | **Détail (segments dépliables)** | haut−152px | En-tête 23min/−1,18kg/150kcal/1,70€. 4 segments : Vélo Bicloo (station Commerce, 7 dispo), Attente 3min (badge ambré), Tram 1→Beaujoire (prochains passages 14:40/47/54), Marche→Polytech. CTA "Partir maintenant". |
| 7 | **Suivi actif (mode sombre)** | haut−172px | Bandeau "Suivi GPS actif · position utilisée uniquement pour ce trajet" (RGPD). ETA "14:55", barre 48%, segment en cours, alerte météo. CTA "Terminer le trajet". |
| 8 | **Fin de trajet (modale)** | centrée | "Trajet terminé", durée réelle vs estimée, CO₂ évité + équivalence voiture, points gagnés + palier, badge débloqué. "Voir mes progrès"/"Retour à la carte". |

**PMR avant/après (comparaison documentée) :**
- Avant : "3 itinéraires", toggle OFF, marche max 15min.
- Après : "2 itinéraires", toggle ON, bandeau ambré "1 itinéraire écarté : « Vélo → Tram »
  (segment vélo, 12 min de marche). Marche plafonnée à 5 min, arrêts non accessibles exclus."

**Desktop (panneau latéral 400px)** : mêmes 6 états 2-6 en sections empilées sans
overlay, réglages avancés en barre d'outils en ligne. Chips de modes étendues (+ Bus,
Navibus, Train). Pied de panneau cite les facteurs ADEME. Sidebar 232px avec bloc
utilisateur ("CM"/"Camille Morel"/"1 240 pts").

### 5.3 Profil de mobilité (écran unique, pas de sous-pages)

Segmented control profil avec pondérations affichées ("CO₂ 0,7 · durée 0,2 · confort
0,1" — reflète exactement les poids `eco` du moteur de scoring), toggle PMR, chips
modes autorisés, slider marche max, 3 boutons "Dénivelé toléré à vélo"
(Éviter/Modéré/Indifférent), toggle "Limiter les changements". **Pas de bouton
Enregistrer** — bandeau "Enregistré automatiquement".

### 5.4 Dashboard gamification

| Écran | Contenu |
|-------|---------|
| **Résumé + CO₂ hebdo** | Header "1 240 pts" / "18,4 kg CO₂ évité", barre palier 83%. Graphique CSS 4 barres (S27-S30). Tableau HTML de répartition par mode (Tramway 42%/21, Vélo 28%/14, Marche 18%/9, Bus 12%/6). Footer facteurs ADEME. |
| **Badges** | "4/12". Débloqués (bordure verte + date) : "10 trajets vélo", "50 kg CO₂ évités", "Premier navibus", "7 jours d'affilée". En cours (barres) : tramway 21/25, CO₂ 68/100kg, marche 31/50km. |

**Desktop** : les deux écrans mobiles fusionnent en une vue unique avec 4 tuiles KPI
(Points, CO₂, Trajets, Badges) ; le tableau de répartition gagne une colonne "CO₂
émis" absente en mobile.

### 5.5 Récompenses

| Écran | Contenu |
|-------|---------|
| **Catalogue** | Solde "1 240 pts". Ticket TAN 1h (400pts, "Échanger"), Journée Bicloo (700pts), Abonnement −20% (2000pts, verrouillé, "Encore 760 pts", barre 62%). |
| **Historique** | 3 statuts : Disponible (bordure verte + code copiable "TAN-8F2K-9QX"), Utilisée, Expirée. Note "conservé 12 mois". Toast "Ticket TAN échangé · −400 pts · solde 840 pts". |

**Desktop** : grille Catalogue 2×2 (4e article "Entrée Musée d'arts" absent du mobile) +
Historique en colonne, cohabitation sans tabs.

### 5.6 Paramètres

| Écran | Contenu |
|-------|---------|
| **Paramètres** | Bandeau ambré permanent "Mode démo actif · Données statiques" si `DEMO_MODE=true`. Groupe Application (Installer, Thème Clair/Sombre/Auto, Rappels). Groupe Confidentialité (Géoloc, conservation 12 mois, politique, export). "Se déconnecter". Bloc rouge isolé "Supprimer mon compte". |
| **Modale suppression** | Inventaire chiffré ("52 trajets", "840 points et 4 badges", "1 récompense non utilisée"), champ de confirmation exigeant la saisie de "SUPPRIMER", boutons à poids égal, lien "exporter vos données" en sortie de secours. |

**Desktop** : 2 colonnes (Application+Compte / Confidentialité+Zone irréversible), ajout
"Langue = Français" absent du mobile. Modale 560px centrée, "Annuler" à gauche /
"Supprimer" à droite.

### 5.7 États vides / erreurs

| Écran | Contenu |
|-------|---------|
| **Aucun résultat** | "Vos réglages sont trop restrictifs pour ce trajet à 14:32", 2 ajustements chiffrés en un tap ("Porter la marche max à 15 min · 3 itinéraires possibles", "Autoriser le bus · 2 itinéraires possibles"). |
| **Hors ligne** | Fond hachuré (pas de tuiles), bandeau "Hors ligne — carte non disponible", items en cache, bouton "Réessayer". |

> **Non trouvé dans les fichiers Claude Design lus à ce jour** : un écran de splash
> screen dédié. À confirmer avant de le retirer de l'implémentation existante.

---

## 6. Règles carte Leaflet

| Élément | Règle |
|---------|-------|
| Tuiles clair | CartoDB Positron + filtre CSS `saturate(.55) contrast(1.02)` |
| Tuiles sombre | CartoDB Dark Matter + filtre CSS `saturate(.5) brightness(.92)` |
| Teinte de survol | Clair : `multiply` 10% `--color-primary` · Sombre : `screen` 30% `#0F3A2C` |
| Tracé marche | Toujours en trait pointillé, quelle que soit la teinte du mode |
| Tous les tracés | Halo blanc (clair) / `#0D1512` (sombre) de 2px pour la lisibilité sur les tuiles |
| Carte (élément) | `role="application"`, `aria-label="Carte de mobilité de Nantes"` |

Aucun style vectoriel custom n'est chargé : la teinte est 100% CSS (`filter`), coût
réseau nul — cohérent avec l'éco-conception.

---

## 7. Responsive (desktop ≥ 1024px)

- Bottom nav mobile → sidebar verticale 232px avec libellés, Paramètres + identité
  utilisateur en pied.
- Bottom sheet → panneau latéral fixe 400px (min 380px) : sections empilées sans overlay
  ni divulgation progressive (tout est visible en même temps).
- Écrans mobiles séquentiels (Résumé/Badges, Catalogue/Historique) fusionnent en une
  seule vue desktop à 2 colonnes.
- Desktop expose plus de contenu simultanément : colonne CO₂ émis en plus, 4e
  récompense visible, modes Navibus/Train visibles sans scroll.
- Modales : ancrées bas (mobile) → centrées 520-560px (desktop), bouton de confirmation
  à droite au lieu du bouton principal en haut.
- Cibles tactiles réduites à 38px sur desktop, sauf les CTA primaires qui gardent leur
  taille mobile.
- Largeur de lecture plafonnée à 1040px, padding page 40px horizontal / 32px vertical.
- Aucun composant ni asset desktop-only : mêmes SVG, mêmes tokens de couleur partout.

---

## 8. Accessibilité — patterns documentés

- Bottom sheet : `role="dialog"` **non modal**, focus rendu au déclencheur à la
  fermeture, Échap replie d'un cran.
- Radiogroup pour les profils (Éco/Rapide/Équilibré), navigation `←→`.
- Autocomplete : `role="combobox"` + `listbox`, debounce 300ms, `role="status"` annonce
  le nombre de résultats.
- Carte : `role="application"`, `aria-label="Carte de mobilité de Nantes"`.
- Tableaux HTML natifs préférés aux graphiques image (dashboard, répartition par mode).
- `aria-current="page"` sur l'item de navigation actif.
- Toasts : `role="status"` `aria-live="polite"` `aria-atomic="true"`.
- Focus visible systématique : anneau 2px `--color-primary` (`--focus-ring`), contrastes
  vérifiés jusqu'à 16,6:1 en mode sombre.
- Contraste texte ≥ 4,5:1 (texte normal), documenté token par token — voir §1.1/1.2.

---

## 9. RGPD — patterns documentés

- Consentement géolocalisation : deux options à poids visuel égal, aucune présélectionnée.
- Bandeau RGPD sur l'écran de connexion, option "Continuer sans compte".
- Conservation des données répétée à deux endroits : trajets ET récompenses, 12 mois.
- Export de données accessible depuis Paramètres ET depuis la modale de suppression
  (sortie de secours).
- Suppression de compte : inventaire chiffré de ce qui sera perdu, confirmation textuelle
  exigée (saisir "SUPPRIMER"), boutons à poids égal — jamais de suppression en un clic.

---

## 10. Plan de réalisation — état d'avancement

Contrairement à la version précédente de ce document, **les maquettes existent déjà**
dans le projet Claude Design listé en en-tête (palette, espacements, écrans mobile et
desktop). Il ne s'agit plus de les concevoir mais de :

1. **Extraire les tokens** → fait, voir `DESIGN-SYSTEM.md`.
2. **Implémenter les tokens Tailwind** dans `src/client/index.css`.
3. **Construire les atomes/molécules React** en suivant §2-4 de ce document.
4. **Reconstruire les écrans** en suivant §5, écran par écran, en réutilisant les
   composants existants (`MapPage`, `JourneyResults`, `JourneyPanel`, `ProfilePage`...)
   listés dans le fichier `github.md` du projet Claude Design.
5. **Vérifier l'accessibilité** (Axe DevTools) sur chaque écran reconstruit, en
   particulier les patterns non modaux (sheet) et les listbox d'autocomplete.
6. Si une présentation Figma est nécessaire pour la soutenance (prototype cliquable),
   l'exporter à partir des écrans déjà validés dans Claude Design plutôt que de repartir
   de zéro.

---

## 11. Assets

- Logo : `docs/design/logo/urbanflow-icon.svg` et `urbanflow-logo-horizontal.svg` —
  déjà synchronisés entre le repo et le projet Claude Design.
- Icônes : jeu unique 24×24, voir §1.7. Bibliothèque exacte à confirmer.

---

## 12. Éco-conception — rappel des règles

- Bundle frontend < 300 ko gzip.
- Lazy loading des routes/pages React.
- Pas de `backdrop-filter`/glassmorphism dans cette direction — 3 niveaux d'ombre plats
  suffisent (§1.8).
- Aucune animation décorative, boucle ou parallaxe ; `transform`/`opacity` uniquement.
- Teinte de carte 100% CSS (`filter`), aucun style vectoriel custom chargé.
- Cache mémoire météo 10 min, `Promise.all()` pour les appels indépendants.

---

## 13. Checklist avant export vers dev

- [ ] Tokens `DESIGN-SYSTEM.md` intégrés dans `index.css`
- [ ] Mode clair testé en premier (c'est le défaut), mode sombre en second
- [ ] Contrastes vérifiés avec Axe DevTools sur chaque écran reconstruit
- [ ] Bottom sheet testée au clavier (Échap, focus trap, retour focus au déclencheur)
- [ ] `prefers-reduced-motion` testé (aucune boucle ne doit persister)
- [ ] Carte : `role="application"` + `aria-label` présents
- [ ] RGPD : consentement géoloc et suppression de compte à poids visuel égal
