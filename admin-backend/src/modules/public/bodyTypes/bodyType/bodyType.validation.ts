// src/modules/public/bodyTypes/bodyType/bodyType.validation.ts

import { z } from 'zod';

export const bodyTypeSlugParamSchema = z.object({
  slug: z.string().trim().min(1),
});

const FUEL_VALUES = ['petrol', 'diesel', 'cng', 'electric'] as const;

export const bodyTypeCarsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(48).default(12),
  brand: z
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

export type BodyTypeSlugParamParsed = z.infer<typeof bodyTypeSlugParamSchema>;
export type BodyTypeCarsQueryParsed = z.infer<typeof bodyTypeCarsQuerySchema>;
