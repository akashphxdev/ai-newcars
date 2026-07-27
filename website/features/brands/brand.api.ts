// features/brands/brand.api.ts

import { apiFetch, getUploadUrl, ApiError } from "@/lib/apiClient";
import type { HomeArticle } from "@/features/articles/article.types";
import type { Brand, BrandWithCount, BrandCarsResult } from "./brand.types";

export async function getBrands(limit = 12): Promise<Brand[]> {
  const brands = await apiFetch<Brand[]>(`/home/brands?limit=${limit}`, { next: { revalidate: 300 } });
  return brands.map((b) => ({ ...b, logoUrl: getUploadUrl(b.logoUrl) }));
}

// "View all brands" page — every active brand, no cap.
export async function getAllBrands(): Promise<Brand[]> {
  const brands = await apiFetch<Brand[]>("/brands", { next: { revalidate: 300 } });
  return brands.map((b) => ({ ...b, logoUrl: getUploadUrl(b.logoUrl) }));
}

// Every active brand with how many available cars it has — powers the
// "Explore other brands" nav on the brand-cars page.
export async function getAllBrandsWithCounts(): Promise<BrandWithCount[]> {
  const brands = await apiFetch<BrandWithCount[]>("/brands/with-counts", { next: { revalidate: 300 } });
  return brands.map((b) => ({ ...b, logoUrl: getUploadUrl(b.logoUrl) }));
}

// Returns null on an unknown brand slug — the page calls notFound() in
// that case rather than handling an exception (same pattern as
// features/compare/compare.api.ts's getCompareData).
export async function getBrandBySlug(slug: string): Promise<Brand | null> {
  try {
    const brand = await apiFetch<Brand>(`/brands/${slug}`, { next: { revalidate: 300 } });
    return { ...brand, logoUrl: getUploadUrl(brand.logoUrl) };
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

export interface BrandCarsFilters {
  page?: number;
  limit?: number;
  bodyType?: string[];
  fuelType?: string[];
  minPrice?: number;
  maxPrice?: number;
  sort?: "popularity" | "price-asc" | "price-desc" | "rating";
}

export async function getBrandCars(slug: string, filters: BrandCarsFilters = {}): Promise<BrandCarsResult | null> {
  const params = new URLSearchParams();
  if (filters.page) params.set("page", String(filters.page));
  if (filters.limit) params.set("limit", String(filters.limit));
  if (filters.bodyType?.length) params.set("bodyType", filters.bodyType.join(","));
  if (filters.fuelType?.length) params.set("fuelType", filters.fuelType.join(","));
  if (filters.minPrice != null) params.set("minPrice", String(filters.minPrice));
  if (filters.maxPrice != null) params.set("maxPrice", String(filters.maxPrice));
  if (filters.sort) params.set("sort", filters.sort);

  try {
    const result = await apiFetch<BrandCarsResult>(`/brands/${slug}/cars?${params.toString()}`, {
      next: { revalidate: 180 },
    });
    return {
      ...result,
      brand: { ...result.brand, logoUrl: getUploadUrl(result.brand.logoUrl) },
      cars: result.cars.map((c) => ({ ...c, coverImageUrl: getUploadUrl(c.coverImageUrl) })),
    };
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

// Backend defaults to 6 most recent — no limit param to send/parse yet.
export async function getBrandArticles(slug: string): Promise<HomeArticle[]> {
  const articles = await apiFetch<HomeArticle[]>(`/brands/${slug}/articles`, { next: { revalidate: 300 } });
  return articles.map((a) => ({ ...a, coverImageUrl: getUploadUrl(a.coverImageUrl) }));
}
