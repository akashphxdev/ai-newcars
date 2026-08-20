// src/modules/locations/state/state.validation.ts

import { z } from 'zod';

export const stateListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().min(1).optional(),
  countryId: z.coerce.number().int().positive().optional(),
  sortBy: z.enum(['name', 'id']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

// Lightweight query for the /options endpoint — no page/limit/search,
// this always returns the full unpaginated set for dropdown use,
// optionally scoped to one country (for cascading Country → State pickers).
export const stateOptionsQuerySchema = z.object({
  countryId: z.coerce.number().int().positive().optional(),
});

export const stateIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// Same convention as city.validation.ts: the frontend generates and sends
// the literal slug, the backend does not derive one. states.slug is NOT
// NULL with no default, so omitting it here is a constraint violation at
// insert time rather than a silent gap.
const stateSlugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(2, 'Slug is required')
  .max(100)
  .regex(slugRegex, 'Slug must be lowercase letters/numbers separated by hyphens (e.g. "tamil-nadu")');

export const createStateSchema = z.object({
  countryId: z.coerce.number().int().positive('countryId is required'),
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  slug: stateSlugSchema,
  code: z.string().trim().toUpperCase().min(1, 'Code is required').max(10),
});

export const updateStateSchema = z.object({
  countryId: z.coerce.number().int().positive('countryId is required'),
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  slug: stateSlugSchema,
  code: z.string().trim().toUpperCase().min(1, 'Code is required').max(10),
});

export type StateListQueryParsed = z.infer<typeof stateListQuerySchema>;
export type StateOptionsQueryParsed = z.infer<typeof stateOptionsQuerySchema>;
export type CreateStateParsed = z.infer<typeof createStateSchema>;
export type UpdateStateParsed = z.infer<typeof updateStateSchema>;