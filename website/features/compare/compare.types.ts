// features/compare/compare.types.ts
//
// Mirrors admin-backend's modules/public/compare types.

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
  fuelType: string | null;
  engineDisplacementCc: number | null;
  mileage: string | null;
  batteryCapacity: string | null;
  range: number | null;
  chargeTime: string | null;
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
