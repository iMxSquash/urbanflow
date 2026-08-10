import type { Coordinates } from './coordinates.js'

export interface BiclooStation {
  id: string
  name: string
  coordinates: Coordinates
  availableBikes: number
  availableDocks: number
  totalDocks: number
}
