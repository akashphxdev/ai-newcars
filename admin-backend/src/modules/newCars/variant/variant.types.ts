// src/modules/newCars/variant/variant.types.ts

import type { TransmissionType } from './variant.validation';

export interface VariantModelSummary {
  id: number;
  name: string;
  brand: { id: number; name: string };
}

export interface VariantRecord {
  id: number;
  modelId: number;
  variantName: string;
  // Decimal fields come back from Prisma serialized as strings — same
  // convention as CarModel's priceMin/priceMax.
  price: string;
  seatingCapacity: number;
  transmission: TransmissionType;
  isTopSeller: boolean;
  createdAt: Date;
  model: VariantModelSummary;
}