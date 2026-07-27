// features/cars/car.api.ts

import { apiFetch, apiFetchPaginated, getUploadUrl, ApiError, type Pagination } from "@/lib/apiClient";
import type { HomeCar, HomeCarType, BrowseCarsResult, CarDetailResult, CarImagesResult, CarFaq } from "./car.types";
import type { HomeArticle } from "@/features/articles/article.types";

export async function getHomeCars(type: HomeCarType, limit = 6): Promise<HomeCar[]> {
  const cars = await apiFetch<HomeCar[]>(`/home/cars?type=${type}&limit=${limit}`, { next: { revalidate: 180 } });
  return cars.map((c) => ({ ...c, coverImageUrl: getUploadUrl(c.coverImageUrl) }));
}

// "View all [type] cars" page — same filters as the homepage rail,
// paginated.
export async function getAllCars(
  type: HomeCarType,
  page = 1,
  limit = 12,
): Promise<{ cars: HomeCar[]; pagination: Pagination }> {
  const { data, pagination } = await apiFetchPaginated<HomeCar>(`/cars?type=${type}&page=${page}&limit=${limit}`, {
    next: { revalidate: 180 },
  });
  return { cars: data.map((c) => ({ ...c, coverImageUrl: getUploadUrl(c.coverImageUrl) })), pagination };
}

export interface BrowseCarsFilters {
  page?: number;
  limit?: number;
  brand?: string[];
  bodyType?: string[];
  fuelType?: string[];
  minPrice?: number;
  maxPrice?: number;
  sort?: "popularity" | "price-asc" | "price-desc" | "rating";
}

// "/new-cars" — the un-scoped browse page (no fixed brand or body type).
export async function getCarsBrowse(filters: BrowseCarsFilters = {}): Promise<BrowseCarsResult> {
  const params = new URLSearchParams();
  if (filters.page) params.set("page", String(filters.page));
  if (filters.limit) params.set("limit", String(filters.limit));
  if (filters.brand?.length) params.set("brand", filters.brand.join(","));
  if (filters.bodyType?.length) params.set("bodyType", filters.bodyType.join(","));
  if (filters.fuelType?.length) params.set("fuelType", filters.fuelType.join(","));
  if (filters.minPrice != null) params.set("minPrice", String(filters.minPrice));
  if (filters.maxPrice != null) params.set("maxPrice", String(filters.maxPrice));
  if (filters.sort) params.set("sort", filters.sort);

  const result = await apiFetch<BrowseCarsResult>(`/cars/browse?${params.toString()}`, { next: { revalidate: 180 } });
  return {
    ...result,
    cars: result.cars.map((c) => ({ ...c, coverImageUrl: getUploadUrl(c.coverImageUrl) })),
  };
}

// "/tata-motors-cars/nexon" (model detail page). Returns null (not a
// thrown error) when the brand/model slug pair doesn't resolve — the page
// calls next/navigation's notFound() in that case, same convention as
// features/articles/article.api.ts's getArticleDetail.
export async function getCarDetail(brandSlug: string, modelSlug: string, variantId?: number): Promise<CarDetailResult | null> {
  try {
    const query = variantId ? `?variant=${variantId}` : "";
    const car = await apiFetch<CarDetailResult>(`/cars/${brandSlug}/${modelSlug}${query}`, { next: { revalidate: 180 } });
    return {
      ...car,
      brand: { ...car.brand, logoUrl: getUploadUrl(car.brand.logoUrl) },
      coverImageUrl: getUploadUrl(car.coverImageUrl),
      images: car.images.map((img) => ({ ...img, imageUrl: getUploadUrl(img.imageUrl) as string })),
      colors: car.colors.map((c) => ({ ...c, imageUrl: getUploadUrl(c.imageUrl) })),
    };
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

// "/tata-motors-cars/nexon/photos" — lean fetch (name + images + colors),
// kept separate from getCarDetail so the photos page doesn't pull the
// full variants/specs/features payload just to render a gallery.
export async function getCarImages(brandSlug: string, modelSlug: string): Promise<CarImagesResult | null> {
  try {
    const result = await apiFetch<CarImagesResult>(`/cars/${brandSlug}/${modelSlug}/images`, { next: { revalidate: 180 } });
    return {
      ...result,
      images: result.images.map((img) => ({ ...img, imageUrl: getUploadUrl(img.imageUrl) as string })),
      colors: result.colors.map((c) => ({ ...c, imageUrl: getUploadUrl(c.imageUrl) })),
    };
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

// FAQs section on the model detail page. Empty array (not null) on 404 —
// the page only needs to know whether there's anything to render.
export async function getCarFaqs(brandSlug: string, modelSlug: string): Promise<CarFaq[]> {
  try {
    return await apiFetch<CarFaq[]>(`/cars/${brandSlug}/${modelSlug}/faqs`, { next: { revalidate: 180 } });
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return [];
    throw err;
  }
}

// "News" section on the model detail page — articles tagged to this exact
// model (ArticleCarModel), not just its brand. Backend defaults to 6.
export async function getCarArticles(brandSlug: string, modelSlug: string): Promise<HomeArticle[]> {
  try {
    const articles = await apiFetch<HomeArticle[]>(`/cars/${brandSlug}/${modelSlug}/articles`, { next: { revalidate: 180 } });
    return articles.map((a) => ({ ...a, coverImageUrl: getUploadUrl(a.coverImageUrl) }));
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return [];
    throw err;
  }
}
