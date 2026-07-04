// src/modules/newCars/powertrainElectric/powertrainElectric.types.ts

import type { TestCycleType, ElectricDrivetrain } from './powertrainElectric.validation';

export interface PowertrainElectricVariantSummary {
  id: number;
  variantName: string;
  model: { id: number; name: string; brand: { id: number; name: string } };
}

export interface PowertrainElectricRecord {
  id: number;
  variantId: number;
  numMotors: number | null;
  motorType: string | null;
  // Decimal fields come back from Prisma serialized as strings — same
  // convention used across CarModel/CarVariant/PowertrainIce.
  batteryCapacity: string | null;
  batteryChemistry: string | null;
  thermalManagementSystem: string | null;
  drivetrain: ElectricDrivetrain | null;
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