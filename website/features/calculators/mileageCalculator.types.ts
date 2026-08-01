// features/calculators/mileageCalculator.types.ts

export const FUEL_TYPES = ["petrol", "diesel", "cng", "ev"] as const;
export type FuelType = (typeof FUEL_TYPES)[number];

export const FUEL_TYPE_LABELS: Record<FuelType, string> = {
  petrol: "Petrol",
  diesel: "Diesel",
  cng: "CNG",
  ev: "EV",
};

export const FUEL_PRICE_UNIT_LABELS: Record<FuelType, string> = {
  petrol: "Per Litre",
  diesel: "Per Litre",
  cng: "Per Kg",
  ev: "Per kWh",
};

export const MILEAGE_UNIT_LABELS: Record<FuelType, string> = {
  petrol: "kmpl",
  diesel: "kmpl",
  cng: "km/kg",
  ev: "km/kWh",
};

// Mirrors admin-backend's CarVariantLookup (modules/public/cars/car/car.service.ts) —
// same shape EmiCalculatorVariant uses, plus the two fields the
// fuel-type filter needs.
export interface MileageCalculatorVariant {
  id: number;
  variantName: string;
  price: string;
  isElectric: boolean;
  fuelType: string | null;
}
