// src/modules/locations/district/district.validation.ts

import { z } from 'zod';

export const districtListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().min(1).optional(),
  stateId: z.coerce.number().int().positive().optional(),
  sortBy: z.enum(['name', 'id']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export const districtIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const createDistrictSchema = z.object({
  stateId: z.coerce.number().int().positive('stateId is required'),
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
});

export const updateDistrictSchema = z.object({
  stateId: z.coerce.number().int().positive('stateId is required'),
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
});

export type DistrictListQueryParsed = z.infer<typeof districtListQuerySchema>;
export type CreateDistrictParsed = z.infer<typeof createDistrictSchema>;
export type UpdateDistrictParsed = z.infer<typeof updateDistrictSchema>;