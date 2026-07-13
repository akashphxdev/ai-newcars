// src/modules/newCars/powertrainElectric/powertrainElectric.types.ts

import type { TestCycleType } from './powertrainElectric.validation';

export interface PowertrainElectricVariantSummary {
  id: number;
  variantName: string;
  model: { id: number; name: string; brand: { id: number; name: string } };
}

export interface AttributeOptionSummary {
  id: number;
  name: string;
  slug: string;
}

export interface PowertrainElectricRecord {
  id: number;
  variantId: number;
  numMotors: number | null;
  motorType: string | null;
  batteryCapacity: string | null;
  batteryChemistry: string | null;
  thermalManagementSystem: string | null;
  drivetrainId: number | null;
  drivetrain: AttributeOptionSummary | null;
  powerPs: number | null;
  torqueNm: number | null;
  claimedRange: number | null;
  realWorldRange: number | null;
  testCycleType: TestCycleType | null;
  topSpeedKmph: number | null;
  topSpeedTimeSec: string | null;
  acChargingOutput: string | null;
  acChargingTime: string | null;
  chargerSizeAc3kwHours: number | null;
  chargerSizeAc7kwHours: number | null;
  chargerSizeAc11kwHours: number | null;
  chargerSizeAc22kwHours: number | null;
  dcChargingOutput: string | null;
  dcFastChargingTime: string | null;
  powertrainBootspace: number | null;
  batteryWarrantyKm: number | null;
  batteryWarrantyYears: number | null;
  motorWarrantyKm: number | null;
  motorWarrantyYears: number | null;
  standardWarrantyKm: string | null;
  standardWarrantyYears: number | null;
  realWorldUrl: string | null;
  cityUrl: string | null;
  highwayUrl: string | null;
  isDefault: boolean;
  isDeleted: boolean;
  deletedBy: number | null;
  deletedAt: Date | null;
  expiresAt: Date | null;
  createdAt: Date;
  variant: PowertrainElectricVariantSummary;
}

// What the listing table actually renders — everything else (charging
// specs, warranty, URLs, etc.) is fetched on demand via getById when a
// row is expanded, instead of being shipped on every list call.
export interface PowertrainElectricListItem {
  id: number;
  variantId: number;
  batteryCapacity: string | null;
  drivetrain: AttributeOptionSummary | null;
  powerPs: number | null;
  torqueNm: number | null;
  claimedRange: number | null;
  isDefault: boolean;
  isDeleted: boolean;
  createdAt: Date;
  variant: PowertrainElectricVariantSummary;
}