// src/modules/public/reviews/review/review.validation.ts

import { z } from 'zod';

export const reviewListQuerySchema = z.object({
  modelId: z.coerce.number().int().positive('modelId is required'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(20).default(10),
  sortBy: z.enum(['createdAt', 'helpfulCount', 'rating']).default('helpfulCount'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const reviewIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

// Every category score is 1-5, same scale as the overall rating —
// e.g. { category: "Comfort", score: 4 }. Capped at 10 entries so a
// malformed request can't insert an unbounded number of rows.
const categoryScoreSchema = z.object({
  category: z.string().trim().min(1).max(30),
  score: z.coerce.number().min(1).max(5),
});

// rating + body are the only two fields that actually make a review a
// review — everything else (title, variant, ownership info, category
// scores) stays optional so the form never blocks on details a reviewer
// might not know or want to share.
export const createReviewSchema = z.object({
  modelId: z.coerce.number().int().positive('modelId is required'),
  variantId: z.coerce.number().int().positive().optional(),
  rating: z.coerce.number().min(1).max(5),
  title: z.string().trim().max(150).optional(),
  body: z.string().trim().min(10, 'Please write at least 10 characters').max(3000),
  ownershipDuration: z.string().trim().max(50).optional(),
  kmDriven: z.coerce.number().int().positive().optional(),
  categoryScores: z.array(categoryScoreSchema).max(10).optional(),
});

export const createReviewReplySchema = z.object({
  body: z.string().trim().min(2, 'Reply must be at least 2 characters').max(2000),
});

export type ReviewListQueryParsed = z.infer<typeof reviewListQuerySchema>;
export type CreateReviewParsed = z.infer<typeof createReviewSchema>;
export type CreateReviewReplyParsed = z.infer<typeof createReviewReplySchema>;
