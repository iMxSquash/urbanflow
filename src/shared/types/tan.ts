import type { Coordinates } from './coordinates.js'

export interface TanLine {
  routeId: string
  shortName: string
  longName: string
  routeType: string
  color: string // hex sans #, ex: "E30613"
  coordinates: [number, number][][] // MultiLineString
}

export interface TanStop {
  stopId: string
  name: string
  coordinates: Coordinates
  wheelchairBoarding: boolean
}
