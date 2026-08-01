// src/modules/public/cars/car/car.validation.ts

import { z } from 'zod';

const CAR_TYPES = ['latest', 'popular', 'upcoming', 'electric'] as const;

export const carListQuerySchema = z.object({
  type: z.enum(CAR_TYPES).default('latest'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(48).default(12),
});

export type CarListQueryParsed = z.infer<typeof carListQuerySchema>;

const FUEL_VALUES = ['petrol', 'diesel', 'cng', 'electric'] as const;
const commaList = () =>
  z
    .string()
    .optional()
    .transform((v) => (v ? v.split(',').map((s) => s.trim()).filter(Boolean) : undefined));

// "/new-cars" — the un-scoped browse page (no fixed brand or body type,
// unlike the brand-cars / body-type-cars pages), so brand AND body type
// are both filterable here.
export const carsBrowseQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(48).default(12),
  brand: commaList(),
  bodyType: commaList(),
  fuelType: z
    .string()
    .optional()
    .transform((v) =>
      v
        ? v
            .split(',')
            .map((s) => s.trim())
            .filter((s): s is (typeof FUEL_VALUES)[number] => (FUEL_VALUES as readonly string[]).includes(s))
        : undefined,
    ),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().nonnegative().optional(),
  sort: z.enum(['popularity', 'price-asc', 'price-desc', 'rating']).default('popularity'),
});

export type CarsBrowseQueryParsed = z.infer<typeof carsBrowseQuerySchema>;

export const carDetailParamSchema = z.object({
  brandSlug: z.string().trim().min(1),
  modelSlug: z.string().trim().min(1),
});

export const carDetailQuerySchema = z.object({
  variant: z.coerce.number().int().positive().optional(),
});

export type CarDetailParamParsed = z.infer<typeof carDetailParamSchema>;
export type CarDetailQueryParsed = z.infer<typeof carDetailQuerySchema>;

// Lightweight picker lookups (EMI calculator's Brand→Model→Variant flow).
export const modelsByBrandQuerySchema = z.object({
  brandId: z.coerce.number().int().positive(),
});

export const variantsByModelQuerySchema = z.object({
  modelId: z.coerce.number().int().positive(),
});

export type ModelsByBrandQueryParsed = z.infer<typeof modelsByBrandQuerySchema>;
export type VariantsByModelQueryParsed = z.infer<typeof variantsByModelQuerySchema>;
