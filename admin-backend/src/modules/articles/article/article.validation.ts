// src/modules/articles/article/article.validation.ts

import { z } from 'zod';

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const ARTICLE_STATUSES = ['draft', 'scheduled', 'published'] as const;

const booleanish = z.preprocess((val) => {
  if (typeof val === 'string') return val === 'true';
  return val;
}, z.boolean());
const idArray = z.preprocess((val) => {
  if (val === undefined || val === null || val === '') return [];
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val);
      return Array.isArray(parsed) ? parsed : [val];
    } catch {
      return [val];
    }
  }
  return [val];
}, z.array(z.coerce.number().int().positive()));

export const articleListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().min(1).optional(),
  categoryId: z.coerce.number().int().positive().optional(),
  brandId: z.coerce.number().int().positive().optional(),
  modelId: z.coerce.number().int().positive().optional(),
  status: z.enum(ARTICLE_STATUSES).optional(),
  isActive: booleanish.optional(),
  sortBy: z.enum(['id', 'title', 'createdAt', 'publishedAt', 'viewCount']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const articleIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

const articleShape = {
  categoryId: z.coerce.number().int().positive('Category is required'),
  authorId: z.coerce.number().int().positive('Author is required'),
  title: z.string().trim().min(3, 'Title must be at least 3 characters').max(200),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(3)
    .max(200)
    .regex(slugRegex, 'Slug must be lowercase letters/numbers separated by hyphens')
    .optional(),
  excerpt: z.string().trim().max(300).nullable().optional(),
  body: z.string().trim().min(1, 'Article content is required'),
  readTimeMinutes: z.coerce.number().int().nonnegative().nullable().optional(),
  status: z.enum(ARTICLE_STATUSES).default('draft'),
  isActive: booleanish,
  scheduledAt: z.coerce.date().nullable().optional(),
  metaTitle: z.string().trim().max(160).nullable().optional(),
  metaDescription: z.string().trim().max(300).nullable().optional(),
  metaKeywords: z.string().trim().max(255).nullable().optional(),
  // Multi-select — an article can cover more than one brand/model
  // (comparison/roundup pieces), hence arrays instead of single ids.
  brandIds: idArray.default([]),
  modelIds: idArray.default([]),
};

function withScheduleRule<T extends z.ZodTypeAny>(schema: T) {
  return schema.superRefine((data: unknown, ctx: z.RefinementCtx) => {
    const d = data as { status: string; scheduledAt?: Date | null };
    if (d.status === 'scheduled') {
      if (!d.scheduledAt) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'scheduledAt is required when status is "scheduled"',
          path: ['scheduledAt'],
        });
      } else if (d.scheduledAt.getTime() <= Date.now()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'scheduledAt must be a future date/time',
          path: ['scheduledAt'],
        });
      }
    }
  });
}

export const createArticleSchema = withScheduleRule(z.object(articleShape));
export const updateArticleSchema = withScheduleRule(z.object(articleShape));

export const updateArticleStatusSchema = z
  .object({
    status: z.enum(ARTICLE_STATUSES),
    scheduledAt: z.coerce.date().nullable().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.status === 'scheduled') {
      if (!data.scheduledAt) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'scheduledAt is required when status is "scheduled"',
          path: ['scheduledAt'],
        });
      } else if (data.scheduledAt.getTime() <= Date.now()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'scheduledAt must be a future date/time',
          path: ['scheduledAt'],
        });
      }
    }
  });

export type ArticleListQueryParsed = z.infer<typeof articleListQuerySchema>;
export type CreateArticleParsed = z.infer<typeof createArticleSchema>;
export type UpdateArticleParsed = z.infer<typeof updateArticleSchema>;
export type UpdateArticleStatusParsed = z.infer<typeof updateArticleStatusSchema>;