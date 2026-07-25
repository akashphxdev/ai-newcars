// src/modules/public/compare/compare.types.ts
//
// Public-safe shapes for the Compare feature — a curated subset of
// CarVariant/CarPowertrainIce/CarPowertrainElectric/CarFeature (not every
// column the admin panel edits), the same "pick what the reader actually
// compares" curation the home/car module already does for cards.

export interface CompareVariantOption {
  id: number;
  variantName: string;
  price: string;
}

export interface CompareCarFeatures {
  airbagsCount: number | null;
  ncapRating: string | null;
  sunroof: boolean;
  rearParkingCamera: boolean;
  cruiseControl: boolean;
  climateControl: boolean;
  keylessEntry: boolean;
  pushButtonStart: boolean;
  androidAuto: boolean;
  appleCarplay: boolean;
  ledHeadlamps: boolean;
  alloyWheels: boolean;
  wirelessCharging: boolean;
}

export interface CompareCarSpecs {
  seatingCapacity: number;
  transmission: string | null;
  // ICE-only — null when the selected variant is electric.
  fuelType: string | null;
  engineDisplacementCc: number | null;
  mileage: string | null;
  // Electric-only — null when the selected variant is ICE.
  batteryCapacity: string | null;
  range: number | null;
  chargeTime: string | null;
  // Shared by both powertrain kinds.
  powerPs: number | null;
  torqueNm: number | null;
  topSpeedKmph: number | null;
  features: CompareCarFeatures;
}

export interface CompareCarResult {
  id: number;
  name: string;
  slug: string;
  brand: { id: number; name: string };
  bodyType: { id: number; name: string } | null;
  coverImageUrl: string | null;
  priceMin: string | null;
  priceMax: string | null;
  ratingAvg: string | null;
  isElectric: boolean;
  selectedVariant: CompareVariantOption | null;
  variantOptions: CompareVariantOption[];
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
