// src/modules/public/articles/article/article.validation.ts

import { z } from 'zod';

export const articleDetailParamSchema = z.object({
  categorySlug: z.string().trim().min(1),
  articleSlug: z.string().trim().min(1),
});

export const categorySlugParamSchema = z.object({
  categorySlug: z.string().trim().min(1),
});

// "More from this category" — excludes the article currently being read.
export const relatedArticlesQuerySchema = z.object({
  exclude: z.string().trim().optional(),
  limit: z.coerce.number().int().min(1).max(20).default(4),
});

export type ArticleDetailParamParsed = z.infer<typeof articleDetailParamSchema>;
export type CategorySlugParamParsed = z.infer<typeof categorySlugParamSchema>;
export type RelatedArticlesQueryParsed = z.infer<typeof relatedArticlesQuerySchema>;
