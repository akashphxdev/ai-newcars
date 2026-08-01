// features/calculators/emiCalculator.types.ts
//
// Mirrors admin-backend's CarModelLookup / CarVariantLookup
// (modules/public/cars/car/car.service.ts).

export interface EmiCalculatorModel {
  id: number;
  name: string;
  slug: string;
  priceMin: string | null;
  priceMax: string | null;
}

export interface EmiCalculatorVariant {
  id: number;
  variantName: string;
  price: string;
}
