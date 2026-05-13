import type { MapLayerKey } from '../stores/map-layers.store'
import { useMapLayersStore } from '../stores/map-layers.store'

interface LayerConfig {
  key: MapLayerKey
  label: string
  color: string
  icon: React.ReactNode
}

const LAYERS: LayerConfig[] = [
  {
    key: 'bikesharing',
    label: 'Bicloo',
    color: '#16a34a',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="5.5" cy="17.5" r="3.5" />
        <circle cx="18.5" cy="17.5" r="3.5" />
        <path d="M15 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm-3 11.5L9 6l-3 3 3.5 4h7" />
        <path d="M15 6l1.5 5.5-4 6" />
      </svg>
    ),
  },
]

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
      <div className="bg-white rounded-xl shadow-card-md border border-slate-100 p-1.5 flex flex-col gap-1">
        {LAYERS.map(({ key, label, color, icon }) => {
          const active = layers[key]
          return (
            <button
              key={key}
              type="button"
              onClick={() => toggleLayer(key)}
              aria-pressed={active}
              aria-label={`${active ? 'Masquer' : 'Afficher'} les stations ${label}`}
              className={[
                'flex items-center gap-2 px-3 h-11 rounded-lg text-body-sm font-medium',
                'transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eco-600',
                active
                  ? 'text-white'
                  : 'text-slate-500 hover:bg-slate-50',
              ].join(' ')}
              style={active ? { background: color } : undefined}
            >
              <span className={active ? 'text-white' : 'text-slate-400'}>
                {icon}
              </span>
              {label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
