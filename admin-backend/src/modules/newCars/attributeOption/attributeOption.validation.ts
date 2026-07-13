// src/modules/newCars/attributeOption/attributeOption.validation.ts
import { z } from 'zod';

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const ATTRIBUTE_OPTION_CATEGORIES = ['transmission', 'drivetrain'] as const;

const categorySchema = z.enum(ATTRIBUTE_OPTION_CATEGORIES, {
  errorMap: () => ({ message: 'category must be either "transmission" or "drivetrain"' }),
});

export const attributeOptionListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(500).default(20),
  search: z.string().trim().min(1).optional(),
  category: categorySchema.optional(),
  sortBy: z.enum(['name', 'id', 'category']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export const attributeOptionIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const createAttributeOptionSchema = z.object({
  category: categorySchema,
  name: z.string().trim().min(1, 'Name is required').max(50),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, 'Slug is required')
    .max(50)
    .regex(slugRegex, 'Slug must be lowercase letters/numbers separated by hyphens (e.g. "manual")'),
});

export const updateAttributeOptionSchema = z.object({
  category: categorySchema,
  name: z.string().trim().min(1, 'Name is required').max(50),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, 'Slug is required')
    .max(50)
    .regex(slugRegex, 'Slug must be lowercase letters/numbers separated by hyphens (e.g. "manual")'),
});

export type AttributeOptionListQueryParsed = z.infer<typeof attributeOptionListQuerySchema>;
export type CreateAttributeOptionParsed = z.infer<typeof createAttributeOptionSchema>;
export type UpdateAttributeOptionParsed = z.infer<typeof updateAttributeOptionSchema>;