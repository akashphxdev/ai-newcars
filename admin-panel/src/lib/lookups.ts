// src/lib/lookups.ts
export interface LookupOption {
  value: number;
  label: string;
}

export const OFFER_TYPE_OPTIONS: LookupOption[] = [
  { value: 1, label: "Cash discount" },
  { value: 2, label: "Exchange bonus" },
  { value: 3, label: "Corporate discount" },
  { value: 4, label: "Loyalty bonus" },
  { value: 5, label: "Finance offer" },
  { value: 6, label: "Other" },
];

export function getOfferTypeLabel(code: number | null | undefined): string {
  if (code == null) return "—";
  return OFFER_TYPE_OPTIONS.find((o) => o.value === code)?.label ?? "—";
}

// ===== Video types =====
// Mirrors VIDEO_TYPE_CODES in backend/src/modules/newCars/video/video.validation.ts —
// keep both in sync if a code is ever added/removed.
export const VIDEO_TYPE_OPTIONS: LookupOption[] = [
  { value: 1, label: "Review" },
  { value: 2, label: "Teaser" },
  { value: 3, label: "Walkaround" },
  { value: 4, label: "Comparison" },
  { value: 5, label: "Launch" },
  { value: 6, label: "Other" },
];

export function getVideoTypeLabel(code: number | null | undefined): string {
  if (code == null) return "—";
  return VIDEO_TYPE_OPTIONS.find((o) => o.value === code)?.label ?? "—";
}

// ===== Fuel types =====
// Mirrors FUEL_TYPE_CODES in backend/src/modules/newCars/powertrainIce/powertrainIce.validation.ts —
// keep both in sync if a code is ever added/removed.
export const FUEL_TYPE_OPTIONS: LookupOption[] = [
  { value: 1, label: "Petrol" },
  { value: 2, label: "Diesel" },
  { value: 3, label: "CNG" },
  { value: 4, label: "LPG" },
  { value: 5, label: "Hybrid" },
];

export function getFuelTypeLabel(code: number | null | undefined): string {
  if (code == null) return "—";
  return FUEL_TYPE_OPTIONS.find((o) => o.value === code)?.label ?? "—";
}

// ===== Test cycle types =====
// Mirrors TEST_CYCLE_TYPE_CODES in backend/src/modules/newCars/powertrainElectric/powertrainElectric.validation.ts —
// keep both in sync if a code is ever added/removed.
export const TEST_CYCLE_TYPE_OPTIONS: LookupOption[] = [
  { value: 1, label: "ARAI" },
  { value: 2, label: "WLTP" },
  { value: 3, label: "EPA" },
  { value: 4, label: "NEDC" },
];

export function getTestCycleTypeLabel(code: number | null | undefined): string {
  if (code == null) return "—";
  return TEST_CYCLE_TYPE_OPTIONS.find((o) => o.value === code)?.label ?? "—";
}