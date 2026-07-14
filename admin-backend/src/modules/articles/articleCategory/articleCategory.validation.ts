// src/modules/articles/articleCategory/articleCategory.validation.ts

import { z } from 'zod';

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const booleanish = z.preprocess((val) => {
  if (typeof val === 'string') return val === 'true';
  return val;
}, z.boolean());

export const articleCategoryListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().min(1).optional(),
  isActive: booleanish.optional(),
  sortBy: z.enum(['name', 'id', 'createdAt']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export const articleCategoryIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const createArticleCategorySchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(50),
  // Required — the frontend always generates/edits this and sends the
  // literal value; the backend no longer auto-generates slugs.
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(2, 'Slug is required')
    .max(50)
    .regex(slugRegex, 'Slug must be lowercase letters/numbers separated by hyphens (e.g. "reviews")'),
  isActive: z.boolean().default(true),
});
export const updateArticleCategorySchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(50),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(2, 'Slug is required')
    .max(50)
    .regex(slugRegex, 'Slug must be lowercase letters/numbers separated by hyphens (e.g. "reviews")'),
  isActive: z.boolean(),
});

// Dedicated status-only payload for the row-level Active/Inactive
// toggle — same pattern as brand.validation.ts's updateBrandStatusSchema.
export const updateArticleCategoryStatusSchema = z.object({
  isActive: z.boolean(),
});

export type ArticleCategoryListQueryParsed = z.infer<typeof articleCategoryListQuerySchema>;
export type CreateArticleCategoryParsed = z.infer<typeof createArticleCategorySchema>;
export type UpdateArticleCategoryParsed = z.infer<typeof updateArticleCategorySchema>;
export type UpdateArticleCategoryStatusParsed = z.infer<typeof updateArticleCategoryStatusSchema>;