# APIs & Données — Guide d'intégration

## Vue d'ensemble des sources de données

| Source | Type | Format | Auth | Usage dans le projet |
|--------|------|--------|------|---------------------|
| Transitous | Routage multimodal | MOTIS JSON | Aucune (User-Agent requis) | Calcul itinéraire A→B |
| OTP (localhost) | Routage multimodal | GraphQL | Aucune (local) | Développement et validation |
| GTFS Naolib | Horaires théoriques | ZIP/CSV | Aucune (téléchargement) | Affichage arrêts, lignes |
| SIRI-Lite Naolib | Prochains passages | JSON/XML | `RequestorRef: opendata` | Horaires temps réel |
| GBFS Bicloo (JCDecaux) | Stations vélos | JSON | Aucune | Marqueurs vélos sur carte |
| OpenWeatherMap | Météo | JSON | API key (free tier) | Pondération scoring |
| CartoDB Positron | Tuiles carte | PNG tiles | Aucune | Fond de carte Leaflet |

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

```javascript
// Avec le client npm
import { MotisClient } from '@motis-project/motis-client'

const client = new MotisClient('https://api.transitous.org/api/')

const journeys = await client.route({
  from: { lat: 47.218, lng: -1.553 },  // Nantes Commerce
  to: { lat: 47.208, lng: -1.567 },    // Gare de Nantes
  time: new Date().toISOString(),
  arriveBy: false,
  modes: ['TRANSIT', 'WALK', 'BIKE']
})
```

---

## 2. OpenTripPlanner (local) — Développement

### Installation locale

```bash
# Télécharger OTP
wget https://repo1.maven.org/maven2/org/opentripplanner/otp-shaded/2.8.1/otp-shaded-2.8.1.jar

# Télécharger les données
# GTFS Naolib depuis transport.data.gouv.fr
# OSM Nantes depuis download.geofabrik.de/europe/france/pays-de-la-loire-latest.osm.pbf

# Construire le graphe
java -Xmx2G -jar otp-shaded-2.8.1.jar --buildStreet --save .

# Lancer le serveur
java -Xmx2G -jar otp-shaded-2.8.1.jar --load --serve .
# API GraphQL disponible sur http://localhost:8080/otp/gtfs/v1
# Interface GraphiQL sur http://localhost:8080/graphiql
```

### Note

OTP 2.x n'expose plus d'API REST (supprimée en 2025). L'API est désormais **GraphQL uniquement**.

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

## 5. GBFS Bicloo (JCDecaux) — Stations vélos

### Endpoint

Format GBFS v2.3 disponible sur transport.data.gouv.fr :
```
https://transport.data.gouv.fr/datasets/offre-et-temps-reel-du-service-velos-en-libre-service-naolib-de-nantes-metropole-au-format-gbfs
```

### Ce que ça retourne

- Position de chaque station (lat/lon)
- Nombre de vélos disponibles
- Nombre de places libres
- Statut de la station (active/inactive)

### ⚠️ Risque identifié

Le contrat Nantes Métropole / JCDecaux pour Bicloo expire en 2026. L'API pourrait changer. Données mockées en fallback (mode démo).

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

### Configuration Leaflet

```typescript
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
  subdomains: 'abcd',
  maxZoom: 20
}).addTo(map)
```

Pas de clé API. Gratuit. Fond épuré professionnel.
