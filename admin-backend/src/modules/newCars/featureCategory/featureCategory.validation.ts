// src/modules/newCars/featureCategory/featureCategory.validation.ts
import { z } from 'zod';

export const featureCategoryListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().min(1).optional(),
});

export const featureCategoryIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const createFeatureCategorySchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100),
  sortOrder: z.coerce.number().int().min(0).default(0),
});

// Partial PATCH — same convention as BodyType/PowertrainIce.
export const updateFeatureCategorySchema = z
  .object({
    name: z.string().trim().min(1, 'Name is required').max(100).optional(),
    sortOrder: z.coerce.number().int().min(0).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided to update',
  });

export type FeatureCategoryListQueryParsed = z.infer<typeof featureCategoryListQuerySchema>;
export type CreateFeatureCategoryParsed = z.infer<typeof createFeatureCategorySchema>;
export type UpdateFeatureCategoryParsed = z.infer<typeof updateFeatureCategorySchema>;
