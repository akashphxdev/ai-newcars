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
  createdAt: Date;
  model: VariantModelSummary;
}