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

export const stateIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const createStateSchema = z.object({
  countryId: z.coerce.number().int().positive('countryId is required'),
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  code: z.string().trim().toUpperCase().min(1, 'Code is required').max(10),
});

export const updateStateSchema = z.object({
  countryId: z.coerce.number().int().positive('countryId is required'),
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  code: z.string().trim().toUpperCase().min(1, 'Code is required').max(10),
});

export type StateListQueryParsed = z.infer<typeof stateListQuerySchema>;
export type CreateStateParsed = z.infer<typeof createStateSchema>;
export type UpdateStateParsed = z.infer<typeof updateStateSchema>;