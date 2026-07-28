// src/modules/public/articles/article/article.validation.ts

import { z } from 'zod';

export const articleDetailParamSchema = z.object({
  categorySlug: z.string().trim().min(1),
  articleSlug: z.string().trim().min(1),
});

export const categorySlugParamSchema = z.object({
  categorySlug: z.string().trim().min(1),
});

// Shared by two callers: the article detail page's "more from this
// category" widget (small limit + exclude, page always 1) and the
// /news/[categorySlug] listing page's "Load more" pagination (no
// exclude, page increments).
export const relatedArticlesQuerySchema = z.object({
  exclude: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(20).default(4),
});

export type ArticleDetailParamParsed = z.infer<typeof articleDetailParamSchema>;
export type CategorySlugParamParsed = z.infer<typeof categorySlugParamSchema>;
export type RelatedArticlesQueryParsed = z.infer<typeof relatedArticlesQuerySchema>;
