// src/modules/newCars/powertrainIce/powertrainIce.types.ts

import type { FuelType, IceTransmissionType, Drivetrain } from './powertrainIce.validation';

export interface PowertrainIceVariantSummary {
  id: number;
  variantName: string;
  model: { id: number; name: string; brand: { id: number; name: string } };
}

export interface PowertrainIceRecord {
  id: number;
  variantId: number;
  fuelType: FuelType;
  fuelTypeSubCategory: string | null;
  // Decimal fields come back from Prisma serialized as strings — same
  // convention used across CarModel/CarVariant.
  fuelTankCapacity: string | null;
  cngTankCapacity: string | null;
  kerbWeight: number | null;
  engineDisplacement: string | null;
  cubicCapacity: number | null;
  cylinders: number | null;
  cylinderCapacity: string | null;
  transmissionType: IceTransmissionType | null;
  transmissionSubType: string | null;
  transmissionSpeed: number | null;
  numGears: number | null;
  isFourByFour: boolean;
  drivetrain: Drivetrain | null;
  powerPs: number | null;
  powerMinRpm: number | null;
  powerMaxRpm: number | null;
  powerWeight: string | null;
  torqueNm: number | null;
  torqueMinRpm: number | null;
  torqueMaxRpm: number | null;
  torqueWeight: string | null;
  claimedFe: string | null;
  realWorldMileage: string | null;
  cityMileage: string | null;
  highwayMileage: string | null;
  topSpeedKmph: number | null;
  topSpeedTimeSec: string | null;
  realWorldUrl: string | null;
  cityUrl: string | null;
  highwayUrl: string | null;
  isDefault: boolean;
  isDeleted: boolean;
  deletedBy: number | null;
  deletedAt: Date | null;
  expiresAt: Date | null;
  createdAt: Date;
  variant: PowertrainIceVariantSummary;
}