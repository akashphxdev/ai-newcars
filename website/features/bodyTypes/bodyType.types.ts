// features/bodyTypes/bodyType.types.ts
//
// Mirrors admin-backend's PublicHomeBodyTypeRecord (modules/public/home/bodyType).

import type { Pagination } from "@/lib/apiClient";
import type { HomeCar } from "@/features/cars/car.types";

export interface BodyType {
  id: number;
  name: string;
  slug: string;
  iconUrl: string | null;
  // Only populated by getBodyTypeBySlug/getBodyTypeCars — the homepage
  // rail's endpoint doesn't select it, so it's optional here rather than
  // claiming every BodyType always has one.
  description?: string | null;
}

export interface BodyTypeWithCount extends BodyType {
  count: number;
}

export interface BodyTypeCarsBrandFilter {
  id: number;
  name: string;
  slug: string;
  count: number;
}

export interface BodyTypeCarsFuelTypeFilter {
  value: string;
  label: string;
  count: number;
}

// Mirrors admin-backend's BodyTypeCarsResult (modules/public/bodyTypes/bodyType).
export interface BodyTypeCarsResult {
  bodyType: BodyType;
  cars: HomeCar[];
  pagination: Pagination;
  filters: {
    brands: BodyTypeCarsBrandFilter[];
    fuelTypes: BodyTypeCarsFuelTypeFilter[];
    priceRange: { min: string; max: string };
  };
}
