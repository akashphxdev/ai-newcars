// features/bodyTypes/bodyType.api.ts

import { apiFetch, getUploadUrl, ApiError } from "@/lib/apiClient";
import type { BodyType, BodyTypeWithCount, BodyTypeCarsResult } from "./bodyType.types";

export async function getBodyTypes(limit = 12): Promise<BodyType[]> {
  const bodyTypes = await apiFetch<BodyType[]>(`/home/body-types?limit=${limit}`, { next: { revalidate: 600 } });
  return bodyTypes.map((b) => ({ ...b, iconUrl: getUploadUrl(b.iconUrl) }));
}

// Every body type with how many available cars it has — powers the
// "Explore other body types" nav chips on the body-type-cars page.
export async function getAllBodyTypesWithCounts(): Promise<BodyTypeWithCount[]> {
  const bodyTypes = await apiFetch<BodyTypeWithCount[]>("/body-types", { next: { revalidate: 300 } });
  return bodyTypes.map((b) => ({ ...b, iconUrl: getUploadUrl(b.iconUrl) }));
}

// Returns null on an unknown slug — the page calls notFound() in that
// case (same pattern as features/brands/brand.api.ts's getBrandBySlug).
export async function getBodyTypeBySlug(slug: string): Promise<BodyType | null> {
  try {
    const bodyType = await apiFetch<BodyType>(`/body-types/${slug}`, { next: { revalidate: 300 } });
    return { ...bodyType, iconUrl: getUploadUrl(bodyType.iconUrl) };
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

export interface BodyTypeCarsFilters {
  page?: number;
  limit?: number;
  brand?: string[];
  fuelType?: string[];
  minPrice?: number;
  maxPrice?: number;
  sort?: "popularity" | "price-asc" | "price-desc" | "rating";
}

export async function getBodyTypeCars(slug: string, filters: BodyTypeCarsFilters = {}): Promise<BodyTypeCarsResult | null> {
  const params = new URLSearchParams();
  if (filters.page) params.set("page", String(filters.page));
  if (filters.limit) params.set("limit", String(filters.limit));
  if (filters.brand?.length) params.set("brand", filters.brand.join(","));
  if (filters.fuelType?.length) params.set("fuelType", filters.fuelType.join(","));
  if (filters.minPrice != null) params.set("minPrice", String(filters.minPrice));
  if (filters.maxPrice != null) params.set("maxPrice", String(filters.maxPrice));
  if (filters.sort) params.set("sort", filters.sort);

  try {
    const result = await apiFetch<BodyTypeCarsResult>(`/body-types/${slug}/cars?${params.toString()}`, {
      next: { revalidate: 180 },
    });
    return {
      ...result,
      bodyType: { ...result.bodyType, iconUrl: getUploadUrl(result.bodyType.iconUrl) },
      cars: result.cars.map((c) => ({ ...c, coverImageUrl: getUploadUrl(c.coverImageUrl) })),
    };
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}
