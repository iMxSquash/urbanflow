import type { MapLayerKey } from '../stores/map-layers.store'
import { useMapLayersStore } from '../stores/map-layers.store'

interface LayerConfig {
  key: MapLayerKey
  label: string
  activeColor: string // couleur du token eco/indigo/etc. pour l'icône active
  activeTextClass: string
  activeBgClass: string
  activeRingClass: string
}

const LAYERS: LayerConfig[] = [
  {
    key: 'bikesharing',
    label: 'Bicloo',
    activeColor: '#15803d',
    activeTextClass: 'text-eco-800',
    activeBgClass: 'bg-eco-50',
    activeRingClass: 'ring-eco-200',
  },
  {
    key: 'tanLines',
    label: 'Lignes',
    activeColor: '#4338ca',
    activeTextClass: 'text-indigo-800',
    activeBgClass: 'bg-indigo-50',
    activeRingClass: 'ring-indigo-200',
  },
  {
    key: 'tanStops',
    label: 'Arrêts',
    activeColor: '#4338ca',
    activeTextClass: 'text-indigo-800',
    activeBgClass: 'bg-indigo-50',
    activeRingClass: 'ring-indigo-200',
  },
]

function BikeIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="5.5" cy="17.5" r="3.5" />
      <circle cx="18.5" cy="17.5" r="3.5" />
      <path d="M15 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm-3 11.5L9 6l-3 3 3.5 4h7" />
      <path d="M15 6l1.5 5.5-4 6" />
    </svg>
  )
}

function RouteIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 6h18M3 12h18M3 18h18" />
    </svg>
  )
}

function StopIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="9" />
    </svg>
  )
}

const LAYER_ICONS: Record<MapLayerKey, React.ReactNode> = {
  bikesharing: <BikeIcon />,
  tanLines: <RouteIcon />,
  tanStops: <StopIcon />,
}

interface MapLayerToggleProps {
  hasJourney: boolean
}

export function MapLayerToggle({ hasJourney }: MapLayerToggleProps) {
  const { layers, toggleLayer } = useMapLayersStore()

  return (
    <div
      className={[
        'absolute left-4 z-[1000]',
        hasJourney ? 'bottom-[calc(58vh_+_12px)] lg:bottom-4' : 'bottom-4',
      ].join(' ')}
      role="group"
      aria-label="Calques de la carte"
    >
      <div className="bg-white rounded-xl shadow-card-md border border-slate-100 p-1.5 flex flex-col gap-2">
        {LAYERS.map(
          ({ key, label, activeColor, activeTextClass, activeBgClass, activeRingClass }) => {
            const active = layers[key]
            return (
              <button
                key={key}
                type="button"
                onClick={() => toggleLayer(key)}
                aria-pressed={active}
                aria-label={`${active ? 'Masquer' : 'Afficher'} : ${label}`}
                className={[
                  'flex items-center gap-2.5 px-3 h-11 rounded-lg text-body-sm font-medium cursor-pointer',
                  'transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eco-600',
                  active
                    ? `${activeBgClass} ${activeTextClass} ring-1 ring-inset ${activeRingClass}`
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700',
                ].join(' ')}
              >
                <span style={{ color: active ? activeColor : undefined }}>{LAYER_ICONS[key]}</span>
                {label}
              </button>
            )
          }
        )}
      </div>
    </div>
  )
}
