import type { Coordinates, Journey, JourneyOptions } from '@shared/types/index.js'

export interface TransportProvider {
  getJourneys(from: Coordinates, to: Coordinates, options: JourneyOptions): Promise<Journey[]>
}
