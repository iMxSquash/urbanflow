export const TRANSPORT_MODES = [
  'walk',
  'bus',
  'tramway',
  'bike',
  'scooter',
  'navibus',
  'train',
] as const
export type TransportMode = (typeof TRANSPORT_MODES)[number]
