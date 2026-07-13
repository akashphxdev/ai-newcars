// src/modules/newCars/bodyType/bodyType.validation.ts
import { z } from 'zod';

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const bodyTypeListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().min(1).optional(),
  sortBy: z.enum(['name', 'id']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export const bodyTypeIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const createBodyTypeSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(50),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(2)
    .max(50)
    .regex(slugRegex, 'Slug must be lowercase letters/numbers separated by hyphens (e.g. "suv")')
    .optional(),
  description: z.string().trim().min(1, 'Description is required').max(255),
});

export const updateBodyTypeSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(50),
  // Optional on purpose — if omitted (or left blank), the service
  // regenerates it from the (possibly new) `name`, same as on create.
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(2)
    .max(50)
    .regex(slugRegex, 'Slug must be lowercase letters/numbers separated by hyphens (e.g. "suv")')
    .optional(),
  description: z.string().trim().min(1, 'Description is required').max(255),
});

export type BodyTypeListQueryParsed = z.infer<typeof bodyTypeListQuerySchema>;
export type CreateBodyTypeParsed = z.infer<typeof createBodyTypeSchema>;
export type UpdateBodyTypeParsed = z.infer<typeof updateBodyTypeSchema>;