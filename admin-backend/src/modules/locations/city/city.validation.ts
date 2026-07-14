// src/modules/locations/city/city.validation.ts

import { z } from 'zod';

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const booleanish = z.preprocess((val) => {
  if (typeof val === 'string') return val === 'true';
  return val;
}, z.boolean());

export const cityListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().min(1).optional(),
  districtId: z.coerce.number().int().positive().optional(),
  stateId: z.coerce.number().int().positive().optional(),
  isMetro: z.coerce.boolean().optional(),
  sortBy: z.enum(['name', 'id']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export const cityIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const createCitySchema = z.object({
  districtId: z.coerce.number().int().positive('districtId is required'),
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  // Required — the frontend always generates/edits this and sends the
  // literal value; the backend no longer auto-generates slugs.
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(2, 'Slug is required')
    .max(100)
    .regex(slugRegex, 'Slug must be lowercase letters/numbers separated by hyphens (e.g. "new-delhi")'),
  isMetro: booleanish.optional(),
  isTopCity: booleanish.optional(),
  isSellCarEnabled: booleanish.optional(),
});

export const updateCitySchema = z
  .object({
    districtId: z.coerce.number().int().positive().optional(),
    name: z.string().trim().min(2).max(100).optional(),
    slug: z.string().trim().toLowerCase().min(2, 'Slug is required').max(100).regex(slugRegex),
    isMetro: booleanish.optional(),
    isTopCity: booleanish.optional(),
    isSellCarEnabled: booleanish.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided to update',
  });

export const updateCityFlagsSchema = z
  .object({
    isMetro: z.boolean().optional(),
    isTopCity: z.boolean().optional(),
    isSellCarEnabled: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one flag must be provided',
  });

export type CityListQueryParsed = z.infer<typeof cityListQuerySchema>;
export type CreateCityParsed = z.infer<typeof createCitySchema>;
export type UpdateCityParsed = z.infer<typeof updateCitySchema>;
export type UpdateCityFlagsParsed = z.infer<typeof updateCityFlagsSchema>;