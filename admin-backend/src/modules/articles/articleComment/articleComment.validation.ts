// src/modules/articles/articleComment/articleComment.validation.ts

import { z } from 'zod';

export const COMMENT_STATUSES = ['visible', 'hidden', 'flagged'] as const;

export const articleCommentListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().min(1).optional(),
  articleId: z.coerce.number().int().positive().optional(),
  status: z.enum(COMMENT_STATUSES).optional(),
  sortBy: z.enum(['id', 'createdAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const articleCommentIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

// Moderation only — the admin panel doesn't author comments, it just
// changes their visibility (approve / hide / flag for review).
export const updateArticleCommentStatusSchema = z.object({
  status: z.enum(COMMENT_STATUSES),
});

export type ArticleCommentListQueryParsed = z.infer<typeof articleCommentListQuerySchema>;
export type UpdateArticleCommentStatusParsed = z.infer<typeof updateArticleCommentStatusSchema>;