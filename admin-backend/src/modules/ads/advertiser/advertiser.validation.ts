// src/modules/ads/advertiser/advertiser.validation.ts

import { z } from 'zod';

const booleanish = z.preprocess((val) => {
  if (typeof val === 'string') return val === 'true';
  return val;
}, z.boolean());

export const advertiserListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().min(1).optional(),
  isActive: booleanish.optional(),
  sortBy: z.enum(['id', 'name', 'createdAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const advertiserIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

const advertiserShape = {
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(150),
  contactName: z.string().trim().min(1, 'Contact person is required').max(100),
  contactMobile: z
    .string()
    .trim()
    .min(1, 'Contact mobile is required')
    .max(15)
    .regex(/^[0-9+\-\s]+$/, 'Contact mobile must be a valid phone number'),
  contactEmail: z
    .string()
    .trim()
    .min(1, 'Contact email is required')
    .email('Must be a valid email')
    .max(150),
  isActive: booleanish.default(true),
};

export const createAdvertiserSchema = z.object(advertiserShape);
export const updateAdvertiserSchema = z.object(advertiserShape);

// Dedicated status-only payload for the row-level Active/Inactive toggle —
// same convention as adPlacement.validation.ts's updateAdPlacementStatusSchema.
export const updateAdvertiserStatusSchema = z.object({
  isActive: z.boolean(),
});

export type AdvertiserListQueryParsed = z.infer<typeof advertiserListQuerySchema>;
export type CreateAdvertiserParsed = z.infer<typeof createAdvertiserSchema>;
export type UpdateAdvertiserParsed = z.infer<typeof updateAdvertiserSchema>;
export type UpdateAdvertiserStatusParsed = z.infer<typeof updateAdvertiserStatusSchema>;
