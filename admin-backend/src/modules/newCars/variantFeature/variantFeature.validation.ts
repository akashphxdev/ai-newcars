// src/modules/newCars/variantFeature/variantFeature.validation.ts

import { z } from 'zod';

export const variantFeatureVariantIdParamSchema = z.object({
  variantId: z.coerce.number().int().positive(),
});

export const listVariantsWithFeaturesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().min(1).optional(),
});

export type ListVariantsWithFeaturesQueryParsed = z.infer<typeof listVariantsWithFeaturesQuerySchema>;

// featureId is the only mandatory field per entry — value is only
// meaningful for value-bearing features (e.g. "6" for Airbags), plain
// toggle features (e.g. Sunroof) just omit it.
export const syncVariantFeaturesSchema = z.object({
  features: z.array(
    z.object({
      featureId: z.coerce.number().int().positive(),
      value: z.string().trim().max(100).optional(),
    }),
  ),
});

export type SyncVariantFeaturesParsed = z.infer<typeof syncVariantFeaturesSchema>;
