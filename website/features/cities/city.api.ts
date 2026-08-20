// features/cities/city.api.ts

import { apiFetch, getUploadUrl } from "@/lib/apiClient";
import type { HomeCity, CityOption } from "./city.types";

export async function getHomeCities(limit = 12): Promise<HomeCity[]> {
  const cities = await apiFetch<HomeCity[]>(`/home/cities?limit=${limit}`, { next: { revalidate: 600 } });
  return cities.map((c) => ({ ...c, logoUrl: getUploadUrl(c.logoUrl) }));
}

// Client-only (called from inside lead-capture modals) — every city in
// one shot for the form's city field. sellCarOnly narrows it to the
// cities where we actually buy or scrap, filtered server-side so the
// response does not carry rows the form would only throw away.
export async function getCityOptions(sellCarOnly = false): Promise<CityOption[]> {
  const query = sellCarOnly ? "?sellCarOnly=true" : "";
  return apiFetch<CityOption[]>(`/cities/options${query}`);
}
