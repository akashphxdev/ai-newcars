// src/modules/cars/brand/brand.validation.ts

import { z } from 'zod';

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const booleanish = z.preprocess((val) => {
  if (typeof val === 'string') return val === 'true';
  return val;
}, z.boolean());

export const brandListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(500).default(20),
  search: z.string().trim().min(1).optional(),
  // Filter by "country of origin" (e.g. all German brands).
  countryOriginId: z.coerce.number().int().positive().optional(),
  isActive: z.coerce.boolean().optional(),
  sortBy: z.enum(['name', 'id']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export const brandIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

// Lightweight query for the /options endpoint — no page/limit/search,
// this always returns the full unpaginated set for dropdown use.
export const brandOptionsQuerySchema = z.object({
  isActive: z.coerce.boolean().optional(),
});

export const createBrandSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  // Required — the frontend always generates/edits this and sends the
  // literal value; the backend no longer auto-generates slugs.
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(2, 'Slug is required')
    .max(100)
    .regex(slugRegex, 'Slug must be lowercase letters/numbers separated by hyphens (e.g. "toyota")'),
  countryOriginId: z.coerce.number().int().positive('countryOriginId is required'),
  isActive: booleanish.optional(),
});

export const updateBrandSchema = z
  .object({
    name: z.string().trim().min(2).max(100).optional(),
    slug: z.string().trim().toLowerCase().min(2, 'Slug is required').max(100).regex(slugRegex),
    countryOriginId: z.coerce.number().int().positive().nullable().optional(),
    isActive: booleanish.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided to update',
  });

export const updateBrandStatusSchema = z.object({
  isActive: z.boolean(),
});

export type BrandListQueryParsed = z.infer<typeof brandListQuerySchema>;
export type BrandOptionsQueryParsed = z.infer<typeof brandOptionsQuerySchema>;
export type CreateBrandParsed = z.infer<typeof createBrandSchema>;
export type UpdateBrandParsed = z.infer<typeof updateBrandSchema>;
export type UpdateBrandStatusParsed = z.infer<typeof updateBrandStatusSchema>;