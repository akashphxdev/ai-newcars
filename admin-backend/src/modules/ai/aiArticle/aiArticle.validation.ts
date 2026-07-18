// src/modules/ai/aiArticle/aiArticle.validation.ts

import { z } from 'zod';
import { AI_ARTICLE_STATUS_CODES } from '../ai.constants';

const statusCodeSchema = z.coerce
  .number()
  .int()
  .refine((v) => (AI_ARTICLE_STATUS_CODES as readonly number[]).includes(v), 'Invalid status code');

// Same pattern as article.validation.ts's slugRegex.
const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const aiArticleListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().min(1).optional(),
  brandId: z.coerce.number().int().positive().optional(),
  status: statusCodeSchema.optional(),
  sortBy: z.enum(['createdAt', 'id']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const aiArticleIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

// Editing only ever touches the generated text — category/brand/model/
// cover image are fixed at generation time.
export const updateAiArticleSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, 'Slug is required')
    .max(200)
    .regex(slugRegex, 'Slug must be lowercase letters/numbers separated by hyphens'),
  excerpt: z.string().trim().min(1, 'Excerpt is required').max(300),
  body: z.string().trim().min(1, 'Article content is required'),
  metaTitle: z.string().trim().min(1, 'Meta title is required').max(160),
  metaDescription: z.string().trim().min(1, 'Meta description is required').max(300),
  metaKeywords: z.string().trim().min(1, 'Meta keywords are required').max(255),
});

export type AiArticleListQueryParsed = z.infer<typeof aiArticleListQuerySchema>;
export type AiArticleIdParamParsed = z.infer<typeof aiArticleIdParamSchema>;
export type UpdateAiArticleParsed = z.infer<typeof updateAiArticleSchema>;
