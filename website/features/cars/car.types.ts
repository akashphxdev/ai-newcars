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
  cylinderCapacity: string | null;
  transmissionType: string | null;
  transmissionSubType: string | null;
  transmissionSpeed: number | null;
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
  cityMileage: string | null;
  highwayMileage: string | null;
  topSpeedKmph: number | null;
  topSpeedTimeSec: string | null;
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
  powertrainBootspace: number | null;
  batteryWarrantyKm: number | null;
  batteryWarrantyYears: number | null;
  motorWarrantyKm: number | null;
  motorWarrantyYears: number | null;
  standardWarrantyKm: string | null;
  standardWarrantyYears: number | null;
}

export interface CarDetailFeatures {
  airbagsCount: number | null;
  absWithEbd: boolean;
  esc: boolean;
  hillAssist: boolean;
  rearParkingCamera: boolean;
  frontParkingSensors: boolean;
  tpms: boolean;
  isofixMounts: boolean;
  ncapRating: string | null;
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
  ledHeadlamps: boolean;
  ledDrls: boolean;
  alloyWheels: boolean;
  roofRails: boolean;
  fogLamps: boolean;
  touchscreenSizeInch: string | null;
  androidAuto: boolean;
  appleCarplay: boolean;
  connectedCarTech: boolean;
  numberOfSpeakers: number | null;
  wirelessCharging: boolean;
  extraFeatures: string | null;
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
  features: CarDetailFeatures | null;
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
