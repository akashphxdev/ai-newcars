// features/brands/brand.types.ts
//
// Mirrors admin-backend's PublicHomeBrandRecord (modules/public/home/brand).

import type { Pagination } from "@/lib/apiClient";
import type { HomeCar } from "@/features/cars/car.types";

export interface Brand {
  id: number;
  name: string;
  slug: string;
  logoUrl: string | null;
}

export interface BrandWithCount extends Brand {
  count: number;
}

export interface BrandCarsBodyTypeFilter {
  id: number;
  name: string;
  slug: string;
  count: number;
}

export interface BrandCarsFuelTypeFilter {
  value: string;
  label: string;
  count: number;
}

// Mirrors admin-backend's BrandCarsResult (modules/public/brands/brand).
export interface BrandCarsResult {
  brand: Brand;
  cars: HomeCar[];
  pagination: Pagination;
  filters: {
    bodyTypes: BrandCarsBodyTypeFilter[];
    fuelTypes: BrandCarsFuelTypeFilter[];
    priceRange: { min: string; max: string };
  };
}
