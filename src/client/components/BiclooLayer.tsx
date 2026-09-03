import { useCallback, useMemo, useState } from 'react'
import L from 'leaflet'
import Supercluster from 'supercluster'
import type { Feature, Point } from 'geojson'
import { Marker, Popup, useMapEvents } from 'react-leaflet'
import type { BiclooStation } from '@shared/types/index'
import { useBiclooStations } from '../hooks/use-bicloo-stations'

// Un <div> Leaflet (`divIcon`) est du HTML réel, pas un attribut de présentation
// SVG : `style="background:var(...)"` inline y résout `var()` normalement, donc
// pas besoin de détection de thème JS ici (contrairement aux tracés SVG de
// JourneyLayer/TanStopsLayer, cf. index.css § OVERRIDES LEAFLET).
function makeIcon(availableBikes: number): L.DivIcon {
  // Vélo dispo → teinte du mode Bicloo ; aucun vélo → gris de référence
  // "--color-mode-car" (jamais sélectionnable comme mode, mais déjà le gris
  // neutre de la palette Estuaire).
  const color = availableBikes > 0 ? 'var(--color-mode-bike)' : 'var(--color-mode-car)'
  return L.divIcon({
    className: '',
    html: `<div style="
      width:32px;height:32px;border-radius:50%;
      background:${color};border:2.5px solid var(--color-surface);
      box-shadow:0 2px 6px rgba(0,0,0,.25);
      display:flex;align-items:center;justify-content:center;
      font-size:12px;font-weight:700;color:var(--color-on-primary);font-family:sans-serif;
      line-height:1;
    ">${availableBikes}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -20],
  })
}

// Icône de cluster : même langage visuel que makeIcon() (badge circulaire,
// bordure --color-surface), mais toujours teintée --color-mode-bike (un
// cluster regroupe plusieurs stations, dispo mêlée) et dimensionnée sur
// l'échelle control-md (40px) plutôt que 32px pour rester bien au-dessus du
// seuil WCAG 2.5.8 une fois isolée à l'écran.
function makeClusterIcon(pointCount: number): L.DivIcon {
  const label = String(pointCount)
  return L.divIcon({
    className: '',
    html: `<div style="
      width:40px;height:40px;border-radius:50%;
      background:var(--color-mode-bike);border:2.5px solid var(--color-surface);
      box-shadow:0 2px 6px rgba(0,0,0,.25);
      display:flex;align-items:center;justify-content:center;
      font-size:13px;font-weight:700;color:var(--color-on-primary);font-family:sans-serif;
      line-height:1;
    ">${label}</div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -24],
  })
}

// Assigne aria-label sur le vrai noeud DOM du marqueur (icon container,
// celui qui porte tabindex="0" role="button"), puisque react-leaflet ne
// route jamais `aria-label` vers le DOM lui-même (MarkerProps ne le déclare
// pas, et L.Marker._initIcon ne connaît que `title`/`alt`/`keyboard`). Un
// callback ref plutôt qu'un `useEffect` + lecture de `ref.current` : la
// hook interne de react-leaflet (`useImperativeHandle(forwardedRef, () =>
// instance)`, sans tableau de dépendances) réinvoque ce callback à CHAQUE
// rendu du Marker, avant même que la clé ne change — donc même si un
// marqueur individuel garde la même key d'un rendu à l'autre (station.id
// stable) pendant qu'un compteur affiché change, le label reste à jour ; et
// si react-leaflet démonte/remonte un Marker (clé de cluster qui change au
// pan/zoom), le callback est réappelé sur le nouvel élément sans jamais le
// manquer.
function markerAriaLabelRef(label: string) {
  return (marker: L.Marker | null) => {
    marker?.getElement()?.setAttribute('aria-label', label)
  }
}

function StationPopup({ station }: { station: BiclooStation }) {
  const available = station.availableBikes > 0

  return (
    <div className="min-w-40">
      <p className="font-semibold text-text mb-2">{station.name}</p>
      <div className="flex flex-col gap-1 text-body-sm text-text-muted">
        <span className={available ? 'text-eco-700 font-medium' : 'text-text-subtle'}>
          {station.availableBikes} vélo{station.availableBikes !== 1 ? 's' : ''} disponible
          {station.availableBikes !== 1 ? 's' : ''}
        </span>
        <span>
          {station.availableDocks} place{station.availableDocks !== 1 ? 's' : ''} libre
          {station.availableDocks !== 1 ? 's' : ''}
        </span>
        <span className="text-text-subtle text-caption">
          {station.totalDocks} emplacements au total
        </span>
      </div>
    </div>
  )
}

// Propriétés portées par chaque point GeoJSON individuel — le strict
// nécessaire pour ré-afficher une station (id pour la key React, le reste
// pour makeIcon()/StationPopup sans revenir chercher dans `stations`).
interface StationPointProperties {
  // Discriminant explicite (posé par nous à la construction des points, pas
  // par supercluster) : permet à TypeScript de distinguer proprement
  // BiclooPointFeature de BiclooClusterFeature dans le rendu ci-dessous.
  cluster: false
  station: BiclooStation
}

// Propriétés qu'un cluster reçoit de supercluster lui-même (`cluster_id`,
// `point_count`...) — pas de `map`/`reduce` fourni au constructeur ci-dessous,
// donc aucune propriété de station individuelle n'y est fusionnée.
interface ClusterPointProperties {
  cluster: true
  cluster_id: number
  point_count: number
  point_count_abbreviated: string | number
}

type BiclooPointFeature = Feature<Point, StationPointProperties>
type BiclooClusterFeature = Feature<Point, ClusterPointProperties>

interface Viewport {
  bbox: [number, number, number, number]
  zoom: number
}

function getViewport(map: L.Map): Viewport {
  const bounds = map.getBounds()
  return {
    bbox: [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()],
    zoom: Math.round(map.getZoom()),
  }
}

// Au-delà de ce zoom, supercluster renvoie les points non regroupés — fixé
// juste sous le maxZoom implicite de Leaflet (18, cf. TileLayer sans prop
// maxZoom dans MapPage) pour garantir la déclusterisation avant le zoom max.
const CLUSTER_MAX_ZOOM = 17
const CLUSTER_RADIUS_PX = 60

// --- Passe de "décollision" en espace écran (pixels) --------------------
//
// supercluster regroupe en distance lat/lng au moment de construire l'index,
// puis place chaque marqueur de cluster au centroïde pondéré de ses membres.
// Un centroïde n'a aucune garantie d'être loin de tout AUTRE marqueur rendu
// à côté de lui : un point resté isolé (non regroupé, car hors du rayon de
// clustering) peut très bien retomber, une fois projeté à l'écran au zoom
// courant, à quelques pixels du badge d'un cluster voisin. C'est une
// propriété inhérente au clustering par centroïde (vraie aussi avec
// leaflet.markercluster, pas un défaut spécifique à supercluster) : rien
// dans `getClusters()` ne raisonne en pixels ni ne connaît les autres
// features déjà placées. D'où cette passe additionnelle, purement en
// pixels (le seul espace où WCAG 2.5.8 / Lighthouse target-size mesure quoi
// que ce soit), qui fusionne après-coup toute paire de marqueurs rendus trop
// proches l'un de l'autre.
const STATION_MARKER_RADIUS_PX = 16 // makeIcon() : 32px de large / 2
const CLUSTER_MARKER_RADIUS_PX = 20 // makeClusterIcon() : 40px de large / 2
// WCAG 2.5.8 (AA) exige au moins 24px d'espace libre entre les BORDS de deux
// cibles adjacentes lorsqu'aucune des deux n'atteint 24x24px. La distance
// centre-à-centre minimale garantissant cet espace pour une paire de
// marqueurs de rayons rA/rB est donc rA + rB + 24 — dérivée des tailles
// réelles des icônes ci-dessus, pas une valeur ronde choisie au hasard.
const WCAG_TARGET_GAP_PX = 24

// Un noeud de rendu unique pour les trois cas possibles après décollision :
// - `station` posé (pointCount === 1, jamais fusionné) → marqueur individuel
//   avec popup, comme avant
// - `clusterId` posé (cluster supercluster natif, jamais fusionné) → clic
//   déclenche l'expansion de zoom exacte calculée par supercluster
// - ni l'un ni l'autre → noeud né d'une fusion de décollision ; rendu comme
//   un badge de cluster (pointCount cumulé), clic = zoom générique centré
//   dessus (supercluster n'a pas de cluster_id pour un groupe qu'il n'a
//   jamais formé lui-même)
interface RenderNode {
  key: string
  lat: number
  lng: number
  px: number
  py: number
  pointCount: number
  station?: BiclooStation
  clusterId?: number
}

function markerRadiusPx(node: Pick<RenderNode, 'pointCount'>): number {
  return node.pointCount > 1 ? CLUSTER_MARKER_RADIUS_PX : STATION_MARKER_RADIUS_PX
}

function minCenterDistancePx(a: RenderNode, b: RenderNode): number {
  return markerRadiusPx(a) + markerRadiusPx(b) + WCAG_TARGET_GAP_PX
}

// Fusionne itérativement toute paire de noeuds plus proche que le seuil
// WCAG, jusqu'à stabilité. Une seule passe peut ne pas suffire : fusionner
// deux points peut rapprocher le résultat d'un troisième noeud encore plus
// proche qu'avant — d'où la boucle. Coût O(n²) par passe, borné à n passes
// (au plus n-1 fusions possibles pour n noeuds de départ) : largement
// suffisant pour la densité réelle du jeu de données (~121 stations Nantes,
// cf. demo-data/stations-bicloo.json), pas besoin d'index spatial ici.
function declutter(nodes: RenderNode[]): RenderNode[] {
  let current = nodes
  const maxIterations = nodes.length

  for (let iteration = 0; iteration < maxIterations; iteration++) {
    let mergeA = -1
    let mergeB = -1

    outer: for (let i = 0; i < current.length; i++) {
      for (let j = i + 1; j < current.length; j++) {
        const dx = current[i].px - current[j].px
        const dy = current[i].py - current[j].py
        const distance = Math.hypot(dx, dy)
        if (distance < minCenterDistancePx(current[i], current[j])) {
          mergeA = i
          mergeB = j
          break outer
        }
      }
    }

    if (mergeA === -1) break // plus aucune paire en collision : stable

    const a = current[mergeA]
    const b = current[mergeB]
    // Position du noeud fusionné : celle du plus "lourd" des deux (le plus
    // grand pointCount), pas un recentroïde. Recalculer un centroïde pixel
    // exigerait de le reprojeter en lat/lng (`containerPointToLatLng`) pour
    // rester utilisable au prochain pan/zoom — complexité inutile ici. Garder
    // la position du groupe le plus représentatif est suffisant : elle reste
    // visuellement ancrée là où se concentre le plus de stations, et à
    // égalité (deux points isolés) on garde `a`, arbitraire mais déterministe.
    const winner = b.pointCount > a.pointCount ? b : a
    const merged: RenderNode = {
      key: `merged-${a.key}-${b.key}`,
      lat: winner.lat,
      lng: winner.lng,
      px: winner.px,
      py: winner.py,
      pointCount: a.pointCount + b.pointCount,
    }

    current = current.filter((_, index) => index !== mergeA && index !== mergeB)
    current.push(merged)
  }

  return current
}

export default function BiclooLayer() {
  const { stations, error } = useBiclooStations()

  const index = useMemo(() => {
    const points: BiclooPointFeature[] = stations.map((station) => ({
      type: 'Feature',
      properties: { cluster: false, station },
      geometry: {
        type: 'Point',
        coordinates: [station.coordinates.lng, station.coordinates.lat],
      },
    }))
    const clusterIndex = new Supercluster<StationPointProperties>({
      radius: CLUSTER_RADIUS_PX,
      maxZoom: CLUSTER_MAX_ZOOM,
    })
    clusterIndex.load(points)
    return clusterIndex
  }, [stations])

  const map = useMapEvents({
    zoomend: () => setViewport(getViewport(map)),
    moveend: () => setViewport(getViewport(map)),
  })

  const [viewport, setViewport] = useState<Viewport>(() => getViewport(map))

  // Dérivé pur de l'index + du viewport courant (+ la carte, pour la
  // projection pixel de la passe de décollision ci-dessous) — pas de
  // setState dans un effet, la recomposition suit l'arrivée des stations
  // (index), les déplacements de carte (viewport) et l'instance carte (map,
  // stable tant que le composant <MapContainer> ne remonte pas) sans rendu
  // en cascade.
  const renderNodes = useMemo<RenderNode[]>(() => {
    const features = index.getClusters(viewport.bbox, viewport.zoom) as Array<
      BiclooPointFeature | BiclooClusterFeature
    >

    const nodes: RenderNode[] = features.map((feature) => {
      const [lng, lat] = feature.geometry.coordinates
      const { x, y } = map.latLngToContainerPoint([lat, lng])

      if (feature.properties.cluster) {
        const { cluster_id: clusterId, point_count: pointCount } = feature.properties
        return { key: `cluster-${clusterId}`, lat, lng, px: x, py: y, pointCount, clusterId }
      }

      const { station } = feature.properties
      return { key: `station-${station.id}`, lat, lng, px: x, py: y, pointCount: 1, station }
    })

    return declutter(nodes)
  }, [index, viewport, map])

  const expandCluster = useCallback(
    (clusterId: number, lng: number, lat: number) => {
      // Déjà plafonné à CLUSTER_MAX_ZOOM + 1 par supercluster lui-même
      // (au-delà, getClusters ne regroupe plus rien).
      const expansionZoom = index.getClusterExpansionZoom(clusterId)
      map.setView([lat, lng], expansionZoom)
    },
    [index, map]
  )

  // Zoom générique pour un noeud né de la décollision : supercluster n'a
  // jamais formé ce groupement lui-même, donc pas de cluster_id ni de
  // getClusterExpansionZoom() exact à réutiliser — un incrément de zoom fixe
  // centré sur le noeud reproduit la même intention (rapprocher jusqu'à
  // séparation), plafonné comme le reste du clustering.
  const expandMerged = useCallback(
    (lat: number, lng: number) => {
      map.setView([lat, lng], Math.min(map.getZoom() + 2, CLUSTER_MAX_ZOOM + 1))
    },
    [map]
  )

  if (error) {
    console.warn('[BiclooLayer] Stations indisponibles :', error)
    return null
  }

  return (
    <>
      {renderNodes.map((node) => {
        if (node.station) {
          const label = `Station Bicloo ${node.station.name} — ${node.station.availableBikes} vélos disponibles`
          return (
            <Marker
              key={node.key}
              position={[node.lat, node.lng]}
              icon={makeIcon(node.station.availableBikes)}
              ref={markerAriaLabelRef(label)}
            >
              <Popup>
                <StationPopup station={node.station} />
              </Popup>
            </Marker>
          )
        }

        const label = `${node.pointCount} station${node.pointCount !== 1 ? 's' : ''} Bicloo, zoomez pour voir le détail`
        const onClick =
          node.clusterId !== undefined
            ? () => expandCluster(node.clusterId as number, node.lng, node.lat)
            : () => expandMerged(node.lat, node.lng)

        return (
          <Marker
            key={node.key}
            position={[node.lat, node.lng]}
            icon={makeClusterIcon(node.pointCount)}
            eventHandlers={{ click: onClick }}
            ref={markerAriaLabelRef(label)}
          />
        )
      })}
    </>
  )
}
