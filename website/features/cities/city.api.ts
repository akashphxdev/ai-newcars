// features/cities/city.api.ts

import { apiFetch, getUploadUrl } from "@/lib/apiClient";
import type { HomeCity } from "./city.types";

export async function getHomeCities(limit = 12): Promise<HomeCity[]> {
  const cities = await apiFetch<HomeCity[]>(`/home/cities?limit=${limit}`, { next: { revalidate: 600 } });
  return cities.map((c) => ({ ...c, logoUrl: getUploadUrl(c.logoUrl) }));
}
