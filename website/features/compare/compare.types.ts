// features/compare/compare.types.ts
//
// Mirrors admin-backend's modules/public/compare types.

import type { CarDetailVariantDimensions } from "@/features/cars/car.types";

export interface CompareVariantOption {
  id: number;
  variantName: string;
  price: string;
}

export interface CompareVariantPowertrainOption {
  id: number;
  label: string;
  isDefault: boolean;
}

// Mirrors car.types.ts's CarDetailFeatureItem/Group — features are now
// fully admin-defined (Feature + FeatureCategory), not a fixed set of
// named columns. `items` only lists features the variant actually has.
export interface CompareCarFeatureItem {
  id: number;
  name: string;
  value: string | null;
}

export interface CompareCarFeatureGroup {
  categoryId: number | null;
  categoryName: string;
  items: CompareCarFeatureItem[];
}

export interface CompareCarSpecs {
  seatingCapacity: number;
  transmission: string | null;
  drivetrain: string | null;
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
  powerPs: number | null;
  torqueNm: number | null;
  topSpeedKmph: number | null;
  dimensions: CarDetailVariantDimensions;
  features: CompareCarFeatureGroup[];
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
  selectedPowertrain: CompareVariantPowertrainOption | null;
  powertrainOptions: CompareVariantPowertrainOption[];
  specs: CompareCarSpecs | null;
}

// 2-4 cars, in the order they were requested in.
export interface CompareResult {
  cars: CompareCarResult[];
}

export interface CarOption {
  id: number;
  name: string;
  slug: string;
  brand: { id: number; name: string };
  coverImageUrl: string | null;
  priceMin: string | null;
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

export type FuelFilter = "petrol" | "diesel" | "cng" | "electric";
