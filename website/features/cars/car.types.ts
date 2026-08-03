// features/cars/car.types.ts
//
// Mirrors admin-backend's PublicHomeCarRecord (modules/public/home/car) —
// backs LatestCars / PopularCars / UpcomingLaunches / ElectricCars.

import type { Pagination } from "@/lib/apiClient";

export type HomeCarType = "latest" | "popular" | "upcoming" | "electric";

export interface CarSpecs {
  seatingCapacity: number | null;
  engineCc: number | null;
  mileage: string | null;
  powerPs: number | null;
  torqueNm: number | null;
  batteryCapacity: string | null;
  range: number | null;
  chargeTime: string | null;
  topSpeedKmph: number | null;
}

export interface HomeCar {
  id: number;
  name: string;
  slug: string;
  brand: { id: number; name: string; slug: string };
  bodyType: { id: number; name: string } | null;
  launchStatus: string;
  expectedLaunchDate: string | null;
  priceMin: string | null;
  priceMax: string | null;
  ratingAvg: string | null;
  coverImageUrl: string | null;
  isElectric: boolean;
  specs: CarSpecs | null;
}

export interface BrowseCarsBrandFilter {
  id: number;
  name: string;
  slug: string;
  count: number;
}

export interface BrowseCarsBodyTypeFilter {
  id: number;
  name: string;
  slug: string;
  count: number;
}

export interface BrowseCarsFuelTypeFilter {
  value: string;
  label: string;
  count: number;
}

// Mirrors admin-backend's BrowseCarsResult (modules/public/cars/car).
export interface BrowseCarsResult {
  cars: HomeCar[];
  pagination: Pagination;
  filters: {
    brands: BrowseCarsBrandFilter[];
    bodyTypes: BrowseCarsBodyTypeFilter[];
    fuelTypes: BrowseCarsFuelTypeFilter[];
    priceRange: { min: string; max: string };
  };
}

// Mirrors admin-backend's CarDetail* types (modules/public/cars/car/car.service.ts).
export interface CarDetailVariantOption {
  id: number;
  variantName: string;
  price: string;
  isTopSeller: boolean;
}

export interface CarDetailIceSpecs {
  fuelType: string | null;
  fuelTypeSubCategory: string | null;
  fuelTankCapacity: string | null;
  cngTankCapacity: string | null;
  kerbWeight: number | null;
  engineDisplacement: string | null;
  cubicCapacity: number | null;
  cylinders: number | null;
  numGears: number | null;
  isFourByFour: boolean;
  drivetrain: string | null;
  powerPs: number | null;
  powerMinRpm: number | null;
  powerMaxRpm: number | null;
  torqueNm: number | null;
  torqueMinRpm: number | null;
  torqueMaxRpm: number | null;
  claimedFe: string | null;
  realWorldMileage: string | null;
  topSpeedKmph: number | null;
  topSpeedTimeSec: string | null;
  emissionNormCompliance: string | null;
  turboCharger: boolean;
}

export interface CarDetailElectricSpecs {
  numMotors: number | null;
  motorType: string | null;
  batteryCapacity: string | null;
  batteryChemistry: string | null;
  thermalManagementSystem: string | null;
  drivetrain: string | null;
  powerPs: number | null;
  torqueNm: number | null;
  claimedRange: number | null;
  realWorldRange: number | null;
  topSpeedKmph: number | null;
  topSpeedTimeSec: string | null;
  acChargingOutput: string | null;
  acChargingTime: string | null;
  dcChargingOutput: string | null;
  dcFastChargingTime: string | null;
  batteryWarrantyKm: number | null;
  batteryWarrantyYears: number | null;
  motorWarrantyKm: number | null;
  motorWarrantyYears: number | null;
  standardWarrantyKm: string | null;
  standardWarrantyYears: number | null;
  emissionNormCompliance: string | null;
  motorPowerKw: string | null;
  chargingPort: string | null;
  chargingOptionsRaw: string | null;
  regenerativeBraking: boolean;
  regenerativeBrakingLevels: number | null;
}

// Shared by ICE and Electric variants alike (chassis-level, not
// powertrain-specific) — mirrors admin-backend's CarDetailVariantDimensions.
export interface CarDetailVariantDimensions {
  length: number | null;
  width: number | null;
  height: number | null;
  wheelBase: number | null;
  groundClearance: number | null;
  bootSpace: number | null;
  frontSuspension: string | null;
  rearSuspension: string | null;
  steeringType: string | null;
  frontBrakeType: string | null;
  rearBrakeType: string | null;
}

// A variant's features are now fully admin-defined (Feature +
// FeatureCategory tables) rather than a fixed set of named columns —
// `items` only ever lists features this variant actually has (presence
// implies "on"); `value` is set for value-bearing features (e.g. "6"
// for Airbags), null for plain toggles (e.g. Sunroof).
export interface CarDetailFeatureItem {
  id: number;
  name: string;
  value: string | null;
}

export interface CarDetailFeatureGroup {
  categoryId: number | null;
  categoryName: string;
  items: CarDetailFeatureItem[];
}

export interface CarDetailSelectedVariant {
  id: number;
  variantName: string;
  price: string;
  seatingCapacity: number;
  transmission: string | null;
  isElectric: boolean;
  ice: CarDetailIceSpecs | null;
  electric: CarDetailElectricSpecs | null;
  dimensions: CarDetailVariantDimensions;
  features: CarDetailFeatureGroup[];
}

export interface CarDetailImage {
  id: number;
  imageUrl: string;
  isPrimary: boolean;
  angle: string | null;
  colorId: number | null;
}

export interface CarDetailColor {
  id: number;
  colorName: string;
  imageUrl: string | null;
  additionalCost: string | null;
  shades: { colorHex: string; sortOrder: number }[];
}

// Mirrors admin-backend's CarDetailResult (modules/public/cars/car/car.service.ts).
export interface CarDetailResult {
  id: number;
  name: string;
  slug: string;
  brand: { id: number; name: string; slug: string; logoUrl: string | null };
  bodyType: { id: number; name: string; slug: string } | null;
  launchStatus: string;
  expectedLaunchDate: string | null;
  priceMin: string | null;
  priceMax: string | null;
  ratingAvg: string | null;
  coverImageUrl: string | null;
  variantOptions: CarDetailVariantOption[];
  // Total variant count for the model — variantOptions above is capped
  // server-side, so this tells the page whether "View All" has more to fetch.
  variantCount: number;
  selectedVariant: CarDetailSelectedVariant | null;
  images: CarDetailImage[];
  colors: CarDetailColor[];
}

// Mirrors admin-backend's CarImagesResult ("/photos" page).
export interface CarImagesResult {
  name: string;
  brand: { name: string; slug: string };
  images: CarDetailImage[];
  colors: CarDetailColor[];
}

// Mirrors admin-backend's CarFaqResult (FAQs section).
export interface CarFaq {
  id: number;
  question: string;
  answer: string;
}
