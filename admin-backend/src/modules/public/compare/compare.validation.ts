// src/modules/public/compare/compare.validation.ts

import { z } from 'zod';

// cars=slugA,slugB,slugC (2-4 slugs) — variants is an optional same-length
// comma list of variant ids, empty segments meaning "use this car's
// default variant" (e.g. "12,,45" picks variant 12 for car 1, default for
// car 2, variant 45 for car 3).
export const compareQuerySchema = z
  .object({
    cars: z
      .string()
      .trim()
      .min(1, 'cars is required')
      .transform((s) => s.split(',').map((slug) => slug.trim()).filter(Boolean)),
    variants: z.string().trim().optional(),
    // Same same-length-comma-list convention as `variants` — which
    // specific powertrain row (of possibly several under that variant)
    // to use, empty segment meaning "use the variant's default".
    powertrains: z.string().trim().optional(),
  })
  .refine((v) => v.cars.length >= 2 && v.cars.length <= 4, {
    message: 'Provide between 2 and 4 car slugs',
    path: ['cars'],
  });
export type CompareQueryParsed = z.infer<typeof compareQuerySchema>;

export const carVariantOptionsParamsSchema = z.object({
  slug: z.string().trim().min(1),
});
export type CarVariantOptionsParamsParsed = z.infer<typeof carVariantOptionsParamsSchema>;

export const variantPowertrainOptionsParamsSchema = z.object({
  slug: z.string().trim().min(1),
  variantId: z.coerce.number().int().positive(),
});
export type VariantPowertrainOptionsParamsParsed = z.infer<typeof variantPowertrainOptionsParamsSchema>;

// Matches the fuel-type filter chips the compare hub page's sidebar
// shows — "electric" isn't an ICE fuelType code, it's cars that have an
// electric powertrain instead of one, so it's handled as its own branch
// in the where-clause rather than a FUEL_TYPE_CODES value.
const FUEL_FILTER_VALUES = ['petrol', 'diesel', 'cng', 'electric'] as const;
export type FuelFilter = (typeof FUEL_FILTER_VALUES)[number];

export const randomPairsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  count: z.coerce.number().int().min(1).max(24).default(6),
  bodyTypeSlug: z.string().trim().optional(),
  fuelType: z.enum(FUEL_FILTER_VALUES).optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  // Scopes BOTH cars in every pair to this brand — e.g. the brand-cars
  // page's "Compare {Brand} Cars" section, which only makes sense as
  // same-brand match-ups (Tata vs Tata), not Tata vs anything.
  brandSlug: z.string().trim().optional(),
});
export type RandomPairsQueryParsed = z.infer<typeof randomPairsQuerySchema>;

export const brandCrossPairsQuerySchema = z.object({
  brandSlug: z.string().trim().min(1),
  count: z.coerce.number().int().min(1).max(12).default(5),
});
export type BrandCrossPairsQueryParsed = z.infer<typeof brandCrossPairsQuerySchema>;

export const modelCrossPairsQuerySchema = z.object({
  brandSlug: z.string().trim().min(1),
  modelSlug: z.string().trim().min(1),
  count: z.coerce.number().int().min(1).max(12).default(5),
});
export type ModelCrossPairsQueryParsed = z.infer<typeof modelCrossPairsQuerySchema>;
