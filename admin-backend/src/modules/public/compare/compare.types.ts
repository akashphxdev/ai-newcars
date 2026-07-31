// src/modules/public/compare/compare.types.ts
//
// Public-safe shapes for the Compare feature — a curated subset of
// CarVariant/CarPowertrainIce/CarPowertrainElectric (not every column the
// admin panel edits), the same "pick what the reader actually compares"
// curation the home/car module already does for cards.

import type { CarDetailFeatureGroup, CarDetailVariantDimensions } from '@/modules/public/cars/car/car.service';

export interface CompareVariantOption {
  id: number;
  variantName: string;
  price: string;
}

// A variant can carry more than one powertrain row (e.g. the same trim
// offered with Petrol and CNG, or Petrol MT/AMT) — this is the "pick
// which one" step between variant and comparison.
export interface CompareVariantPowertrainOption {
  id: number;
  label: string;
  isDefault: boolean;
}

export interface CompareCarSpecs {
  seatingCapacity: number;
  transmission: string | null;
  drivetrain: string | null;
  // ICE-only — null when the selected variant is electric.
  fuelType: string | null;
  fuelTypeSubCategory: string | null;
  engineDisplacementCc: number | null;
  cylinders: number | null;
  numGears: number | null;
  isFourByFour: boolean;
  fuelTankCapacity: string | null;
  cngTankCapacity: string | null;
  kerbWeight: number | null;
  mileage: string | null;
  emissionNormCompliance: string | null;
  turboCharger: boolean;
  // Electric-only — null when the selected variant is ICE.
  batteryCapacity: string | null;
  batteryChemistry: string | null;
  claimedRange: number | null;
  realWorldRange: number | null;
  range: number | null;
  chargeTime: string | null;
  acChargingTime: string | null;
  batteryWarrantyYears: number | null;
  motorPowerKw: string | null;
  chargingPort: string | null;
  chargingOptionsRaw: string | null;
  regenerativeBraking: boolean;
  regenerativeBrakingLevels: number | null;
  // Shared by both powertrain kinds.
  powerPs: number | null;
  torqueNm: number | null;
  topSpeedKmph: number | null;
  dimensions: CarDetailVariantDimensions;
  features: CarDetailFeatureGroup[];
}

export interface CompareCarResult {
  id: number;
  name: string;
  slug: string;
  brand: { id: number; name: string; slug: string };
  bodyType: { id: number; name: string; slug: string } | null;
  coverImageUrl: string | null;
  priceMin: string | null;
  priceMax: string | null;
  ratingAvg: string | null;
  isElectric: boolean;
  selectedVariant: CompareVariantOption | null;
  variantOptions: CompareVariantOption[];
  // Which specific powertrain row (of possibly several under the
  // selected variant) the specs below came from — null only when the
  // variant has no powertrain data at all.
  selectedPowertrain: CompareVariantPowertrainOption | null;
  // Every powertrain option under the selected variant (for the
  // post-hoc "switch powertrain" picker) — empty when the variant has
  // none.
  powertrainOptions: CompareVariantPowertrainOption[];
  specs: CompareCarSpecs | null;
}

// 2-4 cars, in the order the caller asked to compare them in.
export interface CompareResult {
  cars: CompareCarResult[];
}

export interface RandomPairCar {
  id: number;
  name: string;
  slug: string;
  brand: { id: number; name: string };
  coverImageUrl: string | null;
  priceMin: string | null;
}

export interface RandomComparisonPair {
  carA: RandomPairCar;
  carB: RandomPairCar;
}

// For the hub page's "Select Cars to Compare" picker — includes image +
// price (unlike a bare id/name/slug options list) since the picker shows
// a filled card the moment a model is picked, not just after navigating.
export interface CarOption {
  id: number;
  name: string;
  slug: string;
  brand: { id: number; name: string };
  coverImageUrl: string | null;
  priceMin: string | null;
}
