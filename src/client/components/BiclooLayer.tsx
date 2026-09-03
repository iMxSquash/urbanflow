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

  // Dérivé pur de l'index + du viewport courant — pas de setState dans un
  // effet, la recomposition suit l'arrivée des stations (index) et les
  // déplacements de carte (viewport) sans rendu en cascade.
  const clusters = useMemo<Array<BiclooPointFeature | BiclooClusterFeature>>(
    () => index.getClusters(viewport.bbox, viewport.zoom),
    [index, viewport]
  )

  const expandCluster = useCallback(
    (clusterId: number, lng: number, lat: number) => {
      // Déjà plafonné à CLUSTER_MAX_ZOOM + 1 par supercluster lui-même
      // (au-delà, getClusters ne regroupe plus rien).
      const expansionZoom = index.getClusterExpansionZoom(clusterId)
      map.setView([lat, lng], expansionZoom)
    },
    [index, map]
  )

  if (error) {
    console.warn('[BiclooLayer] Stations indisponibles :', error)
    return null
  }

  return (
    <>
      {clusters.map((feature) => {
        const [lng, lat] = feature.geometry.coordinates

        if (feature.properties.cluster) {
          const { cluster_id: clusterId, point_count: pointCount } = feature.properties
          return (
            <Marker
              key={`cluster-${clusterId}`}
              position={[lat, lng]}
              icon={makeClusterIcon(pointCount)}
              eventHandlers={{ click: () => expandCluster(clusterId, lng, lat) }}
              aria-label={`${pointCount} station${pointCount !== 1 ? 's' : ''} Bicloo, zoomez pour voir le détail`}
            />
          )
        }

        const { station } = feature.properties
        return (
          <Marker
            key={station.id}
            position={[station.coordinates.lat, station.coordinates.lng]}
            icon={makeIcon(station.availableBikes)}
            aria-label={`Station Bicloo ${station.name} — ${station.availableBikes} vélos disponibles`}
          >
            <Popup>
              <StationPopup station={station} />
            </Popup>
          </Marker>
        )
      })}
    </>
  )
}
