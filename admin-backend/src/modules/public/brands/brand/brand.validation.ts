// src/modules/public/brands/brand/brand.validation.ts

import { z } from 'zod';

export const brandListQuerySchema = z.object({
  search: z.string().trim().min(1).optional(),
});

export const brandSlugParamSchema = z.object({
  slug: z.string().trim().min(1),
});

const FUEL_VALUES = ['petrol', 'diesel', 'cng', 'electric'] as const;

// bodyType/fuelType come in as comma-separated slugs (checkbox filters,
// so multiple values are normal) — split + drop anything not recognized
// rather than erroring, since this only narrows a filter, it can't
// corrupt data.
export const brandCarsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(48).default(12),
  bodyType: z
    .string()
    .optional()
    .transform((v) => (v ? v.split(',').map((s) => s.trim()).filter(Boolean) : undefined)),
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

export type BrandListQueryParsed = z.infer<typeof brandListQuerySchema>;
export type BrandSlugParamParsed = z.infer<typeof brandSlugParamSchema>;
export type BrandCarsQueryParsed = z.infer<typeof brandCarsQuerySchema>;
