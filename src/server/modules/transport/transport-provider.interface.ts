import type { Coordinates, Journey, JourneyOptions, TransportMode } from '@shared/types/index.js'

export interface TransportProvider {
  readonly supportedModes: TransportMode[]
  getJourneys(from: Coordinates, to: Coordinates, options: JourneyOptions): Promise<Journey[]>
}
