// src/modules/newCars/variant/variant.types.ts

export interface VariantModelSummary {
  id: number;
  name: string;
  brand: { id: number; name: string };
}

// Minimal shape returned for the linked transmission attribute option —
// mirrors AttributeOptionItem in attributeOption.types.ts.
export interface VariantTransmissionSummary {
  id: number;
  name: string;
  slug: string;
}

export interface VariantRecord {
  id: number;
  modelId: number;
  variantName: string;
  // Decimal fields come back from Prisma serialized as strings — same
  // convention as CarModel's priceMin/priceMax.
  price: string;
  seatingCapacity: number;
  transmissionId: number;
  transmission: VariantTransmissionSummary;
  isTopSeller: boolean;
  // Chassis/dimension fields — shared by ICE and Electric variants alike
  // (not powertrain-specific), so they live here instead of being
  // duplicated into both powertrain tables.
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
  createdAt: Date;
  model: VariantModelSummary;
}