import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type MapLayerKey = 'bikesharing'

interface MapLayersState {
  layers: Record<MapLayerKey, boolean>
  toggleLayer: (key: MapLayerKey) => void
}

export const useMapLayersStore = create<MapLayersState>()(
  persist(
    (set) => ({
      layers: { bikesharing: true },
      toggleLayer: (key) =>
        set((s) => ({ layers: { ...s.layers, [key]: !s.layers[key] } })),
    }),
    { name: 'map-layers' }
  )
)
