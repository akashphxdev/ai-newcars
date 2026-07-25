// features/brands/brand.api.ts

import { apiFetch, getUploadUrl } from "@/lib/apiClient";
import type { Brand } from "./brand.types";

export async function getBrands(limit = 12): Promise<Brand[]> {
  const brands = await apiFetch<Brand[]>(`/home/brands?limit=${limit}`, { next: { revalidate: 300 } });
  return brands.map((b) => ({ ...b, logoUrl: getUploadUrl(b.logoUrl) }));
}

// "View all brands" page — every active brand, no cap.
export async function getAllBrands(): Promise<Brand[]> {
  const brands = await apiFetch<Brand[]>("/brands", { next: { revalidate: 300 } });
  return brands.map((b) => ({ ...b, logoUrl: getUploadUrl(b.logoUrl) }));
}
