// features/cities/city.api.ts

import { apiFetch, getUploadUrl } from "@/lib/apiClient";
import type { HomeCity, CityOption } from "./city.types";

export async function getHomeCities(limit = 12): Promise<HomeCity[]> {
  const cities = await apiFetch<HomeCity[]>(`/home/cities?limit=${limit}`, { next: { revalidate: 600 } });
  return cities.map((c) => ({ ...c, logoUrl: getUploadUrl(c.logoUrl) }));
}

// Client-only (called from inside lead-capture modals) — every city in
// one shot for the form's city field.
export async function getCityOptions(): Promise<CityOption[]> {
  return apiFetch<CityOption[]>(`/cities/options`);
}
