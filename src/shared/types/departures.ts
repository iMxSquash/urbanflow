export interface Departure {
  lineRef: string
  lineName: string
  destination: string
  expectedDeparture: string
  realtimeAvailable: boolean
}

export interface StopDepartures {
  stopRef: string
  stopName: string
  departures: Departure[]
}
