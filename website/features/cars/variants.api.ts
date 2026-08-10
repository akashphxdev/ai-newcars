// features/cars/variants.api.ts

import { apiFetch } from "@/lib/apiClient";

export interface ModelVariant {
  id: number;
  variantName: string;
  price: string;
  isTopSeller: boolean;
  seatingCapacity: number;
  isElectric: boolean;
  // Only the powertrain the variant actually has is present.
  batteryCapacity?: string | null;
  claimedRange?: number | null;
  cubicCapacity?: number | null;
  claimedFe?: string | null;
  fuelType?: string | null;
  // What this trim adds over the next-cheaper one. Empty where the
  // difference is powertrain rather than equipment — the table already
  // has columns for battery and range.
  keyAdditions?: string[];
}

export async function getModelVariants(brandSlug: string, modelSlug: string): Promise<ModelVariant[]> {
  try {
    return await apiFetch<ModelVariant[]>(`/cars/${brandSlug}/${modelSlug}/variants`);
  } catch {
    return [];
  }
}
