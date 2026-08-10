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
}

export async function getModelVariants(brandSlug: string, modelSlug: string): Promise<ModelVariant[]> {
  try {
    return await apiFetch<ModelVariant[]>(`/cars/${brandSlug}/${modelSlug}/variants`);
  } catch {
    return [];
  }
}
