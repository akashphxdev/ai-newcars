// src/modules/cars/brand/brand.validation.ts

import { z } from 'zod';

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// Create/update requests are now sent as multipart FormData (to allow an
// optional logo file), so booleans arrive as the strings "true"/"false"
// instead of real JS booleans. This coerces them the same way
// city.validation.ts does for isMetro/isTopCity/isSellCarEnabled.
const booleanish = z.preprocess((val) => {
  if (typeof val === 'string') return val === 'true';
  return val;
}, z.boolean());

export const brandListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
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

export const createBrandSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  // Optional on purpose — if omitted, the service auto-generates one
  // from `name` (see slugify() in brand.service.ts) and de-dupes it.
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(2)
    .max(100)
    .regex(slugRegex, 'Slug must be lowercase letters/numbers separated by hyphens (e.g. "toyota")')
    .optional(),
  countryOriginId: z.coerce.number().int().positive().optional(),
  isActive: booleanish.optional(),
});

export const updateBrandSchema = z
  .object({
    name: z.string().trim().min(2).max(100).optional(),
    slug: z.string().trim().toLowerCase().min(2).max(100).regex(slugRegex).optional(),
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
export type CreateBrandParsed = z.infer<typeof createBrandSchema>;
export type UpdateBrandParsed = z.infer<typeof updateBrandSchema>;
export type UpdateBrandStatusParsed = z.infer<typeof updateBrandStatusSchema>;