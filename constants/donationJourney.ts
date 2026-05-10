/** Shipment-style transparency steps for each dollar (demo progression). */
export const JOURNEY_STEP_LABELS = [
  'Collected',
  'Allocated',
  'Purchasing',
  'Deployed',
  'Impact verified',
] as const;

export type JourneyStepIndex = 0 | 1 | 2 | 3 | 4;
