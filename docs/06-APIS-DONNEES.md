# APIs & Données — Guide d'intégration

## Vue d'ensemble des sources de données

| Source | Type | Format | Auth | Usage dans le projet |
|--------|------|--------|------|---------------------|
| Transitous | Routage TC (bus/tram/navibus/train) | OTP JSON | Aucune (User-Agent requis) | Calcul itinéraire TC A→B |
| OSRM public | Routage vélo/marche/scooter | GeoJSON | Aucune | Distance réelle + shape polyline |
| GTFS Naolib | Horaires théoriques | ZIP/CSV | Aucune (téléchargement) | Affichage arrêts, lignes |
| SIRI-Lite Naolib | Prochains passages | JSON/XML | `RequestorRef: opendata` | Horaires temps réel (non intégré) |
| Bicloo (API Explore Nantes Métropole) | Stations vélos temps réel | JSON | Aucune | Marqueurs vélos sur carte + routing Bicloo |
| TAN circuits & arrêts (API Explore Nantes Métropole) | Lignes et arrêts TAN | JSON | Aucune | Affichage lignes/arrêts sur carte |
| OpenWeatherMap | Météo | JSON | API key (free tier) | Pondération scoring (non intégré) |
| CartoDB Positron | Tuiles carte | PNG tiles | Aucune | Fond de carte Leaflet |
| Nominatim (OpenStreetMap) | Géocodage / autocomplétion d'adresse | JSON | Aucune (`Accept-Language` requis) | Recherche d'adresse départ/arrivée dans `useAddressAutocomplete` |

---

## 1. Transitous (MOTIS API) — Routage multimodal

### Endpoint

```
https://api.transitous.org/api/
```

### Documentation

- OpenAPI spec : https://redocly.github.io/redoc/?url=https://raw.githubusercontent.com/motis-project/motis/refs/tags/v2.8.3/openapi.yaml
- Client JS npm : `@motis-project/motis-client`

### Conditions d'utilisation

- Gratuit pour projets non-commerciaux et FOSS
- Contacter l'équipe sur Matrix avant utilisation : `#transitous:matrix.spline.de`
- Header `User-Agent` requis avec nom du projet + contact
- **Accord obtenu** : ✅ (via Matrix, [date])

### Exemple d'appel (routing)

L'implémentation utilise l'endpoint REST `/v1/plan` (compatible OTP) et non le client npm :

```typescript
const params = new URLSearchParams({
  fromPlace: `${from.lat},${from.lng}`,
  toPlace:   `${to.lat},${to.lng}`,
  numItineraries: '5',
  arriveBy: 'false',
  // Filtre OTP par modes demandés — WALK toujours inclus pour les legs piétons
  mode: 'WALK,BUS,TRAM',   // ou FERRY pour navibus, RAIL pour train
})
const url = `https://api.transitous.org/api/v1/plan?${params}`
```

**Mapping modes OTP :**

| Mode applicatif | Paramètre OTP |
|-----------------|---------------|
| bus | BUS |
| tramway | TRAM |
| navibus | FERRY |
| train | RAIL |

> **Note** : le navibus Naolib (Navibus Loire/Erdre) peut ne pas être présent dans le feed GTFS Transitous ou ne pas desservir toutes les origines/destinations. En l'absence de données FERRY, `itineraries: []` est retourné — c'est un comportement attendu, pas un bug.

---

## 2. OSRM public — Routage vélo/marche/scooter

### Endpoint

```
http://router.project-osrm.org/route/v1/{profile}/{lng1},{lat1};{lng2},{lat2}?overview=full&geometries=geojson
```

### Profils disponibles

- `cycling` — utilisé pour vélo et scooter
- `foot` — utilisé pour marche

> **Limitation** : le serveur public OSRM ne fournit que le profil `driving` pour les durées. Les durées sont donc ignorées et recalculées côté serveur à partir de la distance retournée et d'une vitesse constante par mode (bike 15 km/h, walk 5 km/h, scooter 20 km/h).

### Ce que ça retourne

- Distance réelle par route (mètres)
- Géométrie GeoJSON pour la polyline sur carte

### Exemple d'appel

```typescript
const url = `http://router.project-osrm.org/route/v1/cycling/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`
const { distance, geometry } = await fetch(url).then(r => r.json()).then(d => d.routes[0])
const distKm = distance / 1000
const durationMin = Math.round((distKm / 15) * 60) // 15 km/h pour le vélo
```

### Variable d'environnement

```
OSRM_URL=http://router.project-osrm.org  # peut pointer vers une instance locale
```

---

## 3. GTFS Naolib — Données statiques

### Téléchargement

URL depuis transport.data.gouv.fr :
```
https://transport.data.gouv.fr/datasets/reseau-de-transports-collectifs-naolib
```

Fichier ZIP téléchargeable directement. Licence **ODbL**.

### Fichiers clés

| Fichier | Contenu | Usage MVP |
|---------|---------|-----------|
| `stops.txt` | Tous les arrêts (id, nom, lat, lon) | Marqueurs sur carte + requêtes PostGIS |
| `routes.txt` | Lignes (id, nom, couleur, mode tram/bus) | Affichage info lignes |
| `stop_times.txt` | Horaires passage par arrêt | Consultation horaires théoriques |
| `trips.txt` | Courses (quel trajet, quelle ligne) | Lien entre lignes et horaires |
| `calendar.txt` | Jours de circulation | Filtrage par jour de la semaine |
| `shapes.txt` | Tracé géographique des lignes | Polylines sur carte (optionnel) |

### Import en PostgreSQL (script minimal)

```javascript
import { parse } from 'csv-parse/sync'
import fs from 'fs'
import pg from 'pg'

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })

// Charger les arrêts
const stops = parse(fs.readFileSync('gtfs/stops.txt'), {
  columns: true,
  skip_empty_lines: true
})

for (const stop of stops) {
  await pool.query(
    `INSERT INTO gtfs_stops (stop_id, stop_name, location)
     VALUES ($1, $2, ST_SetSRID(ST_MakePoint($3, $4), 4326))
     ON CONFLICT (stop_id) DO UPDATE SET stop_name = $2`,
    [stop.stop_id, stop.stop_name, parseFloat(stop.stop_lon), parseFloat(stop.stop_lat)]
  )
}
```

### Requête géospatiale — arrêts proches

```sql
SELECT stop_id, stop_name,
  ST_Distance(location::geography, ST_MakePoint(-1.553, 47.218)::geography) AS distance_m
FROM gtfs_stops
WHERE ST_DWithin(location::geography, ST_MakePoint(-1.553, 47.218)::geography, 500)
ORDER BY distance_m;
```

---

## 4. SIRI-Lite Naolib — Temps réel

### Endpoint

Disponible sur transport.data.gouv.fr, jeu de données « Réseau urbain Naolib ».

### Authentification

```
RequestorRef: opendata
```

### Ce que ça retourne

Prochains passages à un arrêt donné, avec :
- Ligne
- Direction
- Heure de passage estimée
- Statut (à l'heure, retardé)

### ⚠️ Note SIRI complet

Le flux SIRI complet (positions véhicules, perturbations détaillées) nécessite potentiellement une demande à Nantes Métropole via data.nantesmetropole.fr/pages/contact/. La clé `opendata` fonctionne pour le SIRI-Lite. Le SIRI complet est un bonus, pas un prérequis du MVP.

---

## 5. Bicloo — Stations vélos

> **Écart avec la doc historique** : cette section documentait initialement le flux
> GBFS v2.3 de transport.data.gouv.fr. L'implémentation réelle (`bicloo.service.ts`)
> utilise l'API Explore (Opendatasoft) de data.nantesmetropole.fr — un jeu de
> données différent, pas au format GBFS. Documenté ici tel qu'implémenté.

### Endpoint

URL fixe (non paramétrable par variable d'env) :
```
https://data.nantesmetropole.fr/api/explore/v2.1/catalog/datasets/244400404_disponibilite-temps-reel-velos-libre-service-naolib-nantes-metropole/records
```

Pagination par 100 résultats (`limit=100&offset=...`), deux pages suffisent pour couvrir toutes les stations Bicloo de la métropole.

### Ce que ça retourne

- Position de chaque station (`position.lat`/`position.lon`)
- Nombre de vélos disponibles (`available_bikes`)
- Nombre de places libres (`available_bike_stands`)
- Capacité totale (`bike_stands`)

### Fallback

En cas d'échec (timeout, HTTP non-2xx) ou en mode démo (`DEMO_MODE=true`), bascule sur `src/demo-data/stations-bicloo.json`.

### ⚠️ Risque identifié

Le contrat Nantes Métropole / JCDecaux pour Bicloo expire en 2026. L'API pourrait changer. Données mockées en fallback (mode démo).

---

## 5bis. TAN circuits & arrêts — Lignes et arrêts pour affichage carte

### Endpoint

Base configurable via `NANTES_API_URL` (défaut : API Explore v2.1 de data.nantesmetropole.fr) :
```
${NANTES_API_URL}/244400404_tan-circuits/records   # lignes (route_id, tracé, couleur)
${NANTES_API_URL}/244400404_tan-arrets/records      # arrêts (stop_id, coordonnées, accessibilité PMR)
```

### Ce que ça retourne

- Lignes : id, noms court/long, type de route, couleur, tracé géographique
- Arrêts : id, nom, coordonnées, accessibilité fauteuil roulant (`wheelchair_boarding`)

### Cache et fallback

Résultat mis en cache en mémoire pour la durée de vie du process (données quasi
statiques). En cas d'échec ou en mode démo, bascule sur `src/demo-data/tan-lines.json`
et `src/demo-data/tan-stops.json`.

---

## 6. OpenWeatherMap — Météo

### Endpoint

```
https://api.openweathermap.org/data/2.5/weather?lat=47.218&lon=-1.553&appid={API_KEY}&units=metric
```

### Free tier

- 60 appels/minute
- Météo actuelle uniquement (suffisant pour le scoring)

### Usage dans le scoring

```typescript
const weather = await fetch(WEATHER_URL)
const data = await weather.json()

const isRaining = data.weather[0].main === 'Rain'
const weightBike = isRaining ? 0.3 : 1.2
const weightTransit = isRaining ? 1.5 : 1.0
```

---

## 7. CartoDB Positron — Tuiles carte

> **Écart avec la doc historique** : CARTO exige désormais une clé API sur
> `basemaps.cartocdn.com` (tuile watermarkée "API KEY REQUIRED" sinon, changement
> de politique CARTO courant 2025, indépendant de ce projet). Clé gratuite (5M
> requêtes/mois, fair use) obtenue par email sans création de compte sur
> [carto.com/basemaps/apikey](https://carto.com/basemaps/apikey/), en fournissant
> le(s) domaine(s) d'usage (`localhost` en dev, le domaine Vercel en prod).

### Configuration Leaflet

```typescript
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png?key=VITE_CARTO_API_KEY', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
  subdomains: 'abcd',
  maxZoom: 20
}).addTo(map)
```

Clé API requise (paramètre `key`, variable d'env `VITE_CARTO_API_KEY`). Fond épuré professionnel.

---

## 8. Nominatim (OpenStreetMap) — Autocomplétion d'adresse

> **Seule intégration appelée directement depuis le navigateur**, sans passer par le
> backend (toutes les autres sources de ce document sont proxyées par `src/server`).
> Choix assumé : c'est une recherche "au fil de la frappe" (debounce 300ms), donc à
> faible latence tolérée — ajouter un aller-retour backend n'apporterait ni cache ni
> masquage de clé (Nominatim n'en requiert pas) pour ce endpoint public en lecture
> seule. Écarte de fait Nominatim du filtre CORS applicatif (`CORS_ORIGIN`) et du rate
> limiting global de `index.ts`, qui ne couvrent que `/api/*`.

### Endpoint

```
https://nominatim.openstreetmap.org/search
```

Implémenté dans `src/client/hooks/useAddressAutocomplete.ts`.

### Paramètres utilisés

```
format=json&limit=5&countrycodes=fr&addressdetails=1&q={saisie}&viewbox=-2.1,47.0,-1.0,47.5
```

`viewbox` biaise (sans borner strictement) les résultats vers Nantes Métropole. Header
`Accept-Language: fr` pour des libellés en français.

### Conditions d'utilisation

Politique d'usage de l'instance publique OSM ([usage policy](https://operations.osmfoundation.org/policies/nominatim/)) :
1 req/s max, `User-Agent`/`Referer` identifiable (fourni implicitement par le navigateur),
pas d'usage commercial à fort volume. Le debounce 300ms côté client reste largement
sous la limite pour un usage interactif mono-utilisateur ; pas adapté à un volume de
production plus large sans passer par une instance self-hébergée ou un fournisseur
commercial (ex. Photon, Mapbox Geocoding).

### RGPD

Les coordonnées renvoyées sont celles du lieu recherché (adresse publique), pas une
donnée personnelle de l'utilisateur. Une fois sélectionnées, elles suivent le même
chemin que toute origine/destination saisie manuellement : arrondies à 4 décimales
avant transmission à Transitous/OSRM (cf. CLAUDE.md § RGPD), jamais stockées en base
au-delà du calcul d'itinéraire.
