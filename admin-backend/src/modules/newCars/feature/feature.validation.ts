// src/modules/newCars/feature/feature.validation.ts

import { z } from 'zod';

export const featureListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().min(1).optional(),
  categoryId: z.coerce.number().int().positive().optional(),
});

export const featureIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

// name + categoryId both required — this is the manual "Add Feature"
// admin form, where picking a category up front is good UX. The DB
// column itself stays nullable (categoryId is optional on the Prisma
// model) purely to support the bulk scrape-import path, which writes
// directly via Prisma and bypasses this HTTP validation entirely.
export const createFeatureSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(150),
  categoryId: z.coerce.number().int().positive('Category is required'),
});

export const updateFeatureSchema = z
  .object({
    name: z.string().trim().min(1, 'Name is required').max(150).optional(),
    categoryId: z.coerce.number().int().positive().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided to update',
  });

export type FeatureListQueryParsed = z.infer<typeof featureListQuerySchema>;
export type CreateFeatureParsed = z.infer<typeof createFeatureSchema>;
export type UpdateFeatureParsed = z.infer<typeof updateFeatureSchema>;
