// features/cars/car.api.ts

import { apiFetch, apiFetchPaginated, getUploadUrl, type Pagination } from "@/lib/apiClient";
import type { HomeCar, HomeCarType } from "./car.types";

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
