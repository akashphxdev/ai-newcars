// src/modules/ads/adPlacement/adPlacement.validation.ts

import { z } from 'zod';

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const dimensionsRegex = /^\d+x\d+$/;

// Numeric codes only — labels live on the frontend
// (front/src/lib/lookups.ts's PAGE_TYPE_OPTIONS). Backend just needs to
// know which codes are currently valid. Same convention as
// video.validation.ts's VIDEO_TYPE_CODES.
//   1 = Home, 2 = Car, 3 = Article
export const PAGE_TYPE_CODES = [1, 2, 3] as const;

// Numeric codes only — labels live on the frontend
// (front/src/lib/lookups.ts's AD_TYPE_OPTIONS).
//   1 = Header, 2 = Middle, 3 = Footer, 4 = Slider
export const AD_TYPE_CODES = [1, 2, 3, 4] as const;

const booleanish = z.preprocess((val) => {
  if (typeof val === 'string') return val === 'true';
  return val;
}, z.boolean());

const pageTypeCodeSchema = z
  .coerce.number()
  .int()
  .refine((v) => (PAGE_TYPE_CODES as readonly number[]).includes(v), 'Invalid pageType code');

const adTypeCodeSchema = z
  .coerce.number()
  .int()
  .refine((v) => (AD_TYPE_CODES as readonly number[]).includes(v), 'Invalid adType code');

export const adPlacementListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().min(1).optional(),
  pageType: z.coerce.number().int().optional(),
  adType: z.coerce.number().int().optional(),
  isActive: booleanish.optional(),
  sortBy: z.enum(['id', 'name', 'slug']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export const adPlacementIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

const adPlacementShape = {
  name: z.string().trim().min(3, 'Name must be at least 3 characters').max(100),

  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, 'Slug is required')
    .max(100)
    .regex(slugRegex, 'Slug must be lowercase letters/numbers separated by hyphens (e.g. "homepage-top-banner")'),
  pageType: pageTypeCodeSchema,
  adType: adTypeCodeSchema,
  dimensions: z
    .string()
    .trim()
    .min(1, 'Dimensions is required')
    .max(20)
    .regex(dimensionsRegex, 'Dimensions must be in WIDTHxHEIGHT format (e.g. "970x250")'),
  isActive: booleanish.default(true),
};

export const createAdPlacementSchema = z.object(adPlacementShape);
export const updateAdPlacementSchema = z.object(adPlacementShape);

// Dedicated status-only payload for the row-level Active/Inactive toggle.
export const updateAdPlacementStatusSchema = z.object({
  isActive: z.boolean(),
});

export type AdPlacementListQueryParsed = z.infer<typeof adPlacementListQuerySchema>;
export type CreateAdPlacementParsed = z.infer<typeof createAdPlacementSchema>;
export type UpdateAdPlacementParsed = z.infer<typeof updateAdPlacementSchema>;
export type UpdateAdPlacementStatusParsed = z.infer<typeof updateAdPlacementStatusSchema>;
