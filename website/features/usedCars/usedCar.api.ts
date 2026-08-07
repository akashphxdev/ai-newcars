// features/usedCars/usedCar.api.ts

import { apiFetch, getUploadUrl } from "@/lib/apiClient";
import type { UsedCarsByCity } from "./usedCar.types";

export async function getUsedCarsByCity(
  citySlug: string,
  limit = 12,
): Promise<UsedCarsByCity | null> {
  try {
    const res = await apiFetch<UsedCarsByCity>(
      `/used-cars?city=${encodeURIComponent(citySlug)}&limit=${limit}`,
    );
    return {
      ...res,
      listings: res.listings.map((l) => ({ ...l, imageUrl: getUploadUrl(l.imageUrl) })),
    };
  } catch {
    // An unknown city 404s; the section simply stays hidden.
    return null;
  }
}
