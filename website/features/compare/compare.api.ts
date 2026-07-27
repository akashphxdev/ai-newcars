// features/compare/compare.api.ts

import { apiFetch, apiFetchPaginated, getUploadUrl, ApiError, type Pagination } from "@/lib/apiClient";
import type { CompareResult, CarOption, CompareVariantOption, RandomComparisonPair, FuelFilter } from "./compare.types";

function withResolvedImage<T extends { coverImageUrl: string | null }>(car: T): T {
  return { ...car, coverImageUrl: getUploadUrl(car.coverImageUrl) };
}

// Returns null on an unknown car slug — the page calls notFound() in
// that case rather than handling an exception (same pattern as
// features/articles/article.api.ts's getArticleBySlug).
//
// `variantIds` is positional with `carSlugs` — undefined at an index
// means "use that car's default variant".
export async function getCompareData(carSlugs: string[], variantIds?: (number | undefined)[]): Promise<CompareResult | null> {
  const params = new URLSearchParams({ cars: carSlugs.join(",") });
  if (variantIds?.some((v) => v != null)) {
    params.set("variants", carSlugs.map((_, i) => variantIds[i] ?? "").join(","));
  }

  try {
    const result = await apiFetch<CompareResult>(`/compare?${params.toString()}`, { next: { revalidate: 300 } });
    return { cars: result.cars.map(withResolvedImage) };
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

export async function getCarOptions(): Promise<CarOption[]> {
  const options = await apiFetch<CarOption[]>(`/compare/car-options`, { next: { revalidate: 300 } });
  return options.map(withResolvedImage);
}

export async function getCarVariantOptions(slug: string): Promise<CompareVariantOption[]> {
  return apiFetch<CompareVariantOption[]>(`/compare/car-options/${slug}/variants`, { next: { revalidate: 300 } });
}

export interface RandomPairsFilters {
  page?: number;
  count?: number;
  bodyTypeSlug?: string;
  fuelType?: FuelFilter;
  minPrice?: number;
  maxPrice?: number;
  brandSlug?: string;
}

export async function getRandomPairs(filters: RandomPairsFilters = {}): Promise<{ pairs: RandomComparisonPair[]; pagination: Pagination }> {
  const params = new URLSearchParams();
  if (filters.page) params.set("page", String(filters.page));
  if (filters.count) params.set("count", String(filters.count));
  if (filters.bodyTypeSlug) params.set("bodyTypeSlug", filters.bodyTypeSlug);
  if (filters.fuelType) params.set("fuelType", filters.fuelType);
  if (filters.minPrice != null) params.set("minPrice", String(filters.minPrice));
  if (filters.maxPrice != null) params.set("maxPrice", String(filters.maxPrice));
  if (filters.brandSlug) params.set("brandSlug", filters.brandSlug);

  const { data, pagination } = await apiFetchPaginated<RandomComparisonPair>(`/compare/random-pairs?${params.toString()}`, {
    next: { revalidate: 180 },
  });

  return {
    pairs: data.map((pair) => ({ carA: withResolvedImage(pair.carA), carB: withResolvedImage(pair.carB) })),
    pagination,
  };
}

// Cross-brand match-ups (this brand vs every other brand) — distinct
// from getRandomPairs({ brandSlug }), which pairs cars WITHIN one brand.
export async function getBrandCrossPairs(brandSlug: string, count = 5): Promise<RandomComparisonPair[]> {
  const pairs = await apiFetch<RandomComparisonPair[]>(
    `/compare/brand-cross-pairs?brandSlug=${encodeURIComponent(brandSlug)}&count=${count}`,
    { next: { revalidate: 180 } },
  );
  return pairs.map((pair) => ({ carA: withResolvedImage(pair.carA), carB: withResolvedImage(pair.carB) }));
}

// Model page's "Comparison" section — this exact model vs `count` random
// other models (always this car on one side, never two other cars paired
// together).
export async function getModelCrossPairs(brandSlug: string, modelSlug: string, count = 5): Promise<RandomComparisonPair[]> {
  const pairs = await apiFetch<RandomComparisonPair[]>(
    `/compare/model-cross-pairs?brandSlug=${encodeURIComponent(brandSlug)}&modelSlug=${encodeURIComponent(modelSlug)}&count=${count}`,
    { next: { revalidate: 180 } },
  );
  return pairs.map((pair) => ({ carA: withResolvedImage(pair.carA), carB: withResolvedImage(pair.carB) }));
}
