// features/compare/compare.types.ts
//
// Mirrors admin-backend's modules/public/compare types.

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

export interface CompareCarFeatures {
  // Safety
  airbagsCount: number | null;
  absWithEbd: boolean;
  esc: boolean;
  hillAssist: boolean;
  rearParkingCamera: boolean;
  frontParkingSensors: boolean;
  tpms: boolean;
  isofixMounts: boolean;
  ncapRating: string | null;
  // Comfort & convenience
  sunroof: boolean;
  keylessEntry: boolean;
  pushButtonStart: boolean;
  cruiseControl: boolean;
  climateControl: boolean;
  rearAcVents: boolean;
  autoDimmingMirror: boolean;
  powerWindows: boolean;
  upholsteryType: string | null;
  adjustableSeats: boolean;
  ventilatedSeats: boolean;
  rearArmrest: boolean;
  // Exterior
  ledHeadlamps: boolean;
  ledDrls: boolean;
  alloyWheels: boolean;
  roofRails: boolean;
  fogLamps: boolean;
  // Technology
  touchscreenSizeInch: string | null;
  androidAuto: boolean;
  appleCarplay: boolean;
  connectedCarTech: boolean;
  numberOfSpeakers: number | null;
  wirelessCharging: boolean;
}

export interface CompareCarSpecs {
  seatingCapacity: number;
  transmission: string | null;
  drivetrain: string | null;
  fuelType: string | null;
  fuelTypeSubCategory: string | null;
  engineDisplacementCc: number | null;
  cylinders: number | null;
  gearboxType: string | null;
  numGears: number | null;
  isFourByFour: boolean;
  fuelTankCapacity: string | null;
  cngTankCapacity: string | null;
  kerbWeight: number | null;
  mileage: string | null;
  cityMileage: string | null;
  highwayMileage: string | null;
  batteryCapacity: string | null;
  batteryChemistry: string | null;
  claimedRange: number | null;
  realWorldRange: number | null;
  range: number | null;
  chargeTime: string | null;
  acChargingTime: string | null;
  powertrainBootspace: number | null;
  batteryWarrantyYears: number | null;
  powerPs: number | null;
  torqueNm: number | null;
  topSpeedKmph: number | null;
  features: CompareCarFeatures;
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
