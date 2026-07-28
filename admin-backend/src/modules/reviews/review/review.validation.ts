// src/modules/reviews/review/review.validation.ts

import { z } from 'zod';

export const REVIEW_STATUSES = ['pending', 'approved', 'rejected'] as const;

// Query-string booleans arrive as the strings "true"/"false" — plain
// z.coerce.boolean() incorrectly coerces the STRING "false" to `true`.
// Same fix as brand.validation.ts / offer.validation.ts's `booleanish`.
const booleanish = z.preprocess((val) => {
  if (typeof val === 'string') return val === 'true';
  return val;
}, z.boolean());

export const reviewListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  // Matches against title/body.
  search: z.string().trim().min(1).optional(),
  modelId: z.coerce.number().int().positive().optional(),
  status: z.enum(REVIEW_STATUSES).optional(),
  isVerifiedOwner: booleanish.optional(),
  sortBy: z.enum(['id', 'createdAt', 'rating', 'helpfulCount']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const reviewIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

// Admin can only move a review to approved/rejected — "pending" is where
// every review starts, never a state the admin sets it back to.
// rejectedReason is required exactly when rejecting, same idea as
// updateVideoSchema's required-on-both-create-and-update convention
// elsewhere in this codebase.
export const updateReviewStatusSchema = z
  .object({
    status: z.enum(['approved', 'rejected']),
    rejectedReason: z.string().trim().max(255).optional(),
  })
  .refine((data) => data.status !== 'rejected' || !!data.rejectedReason, {
    message: 'rejectedReason is required when rejecting a review',
    path: ['rejectedReason'],
  });

// Admin's official reply to a review — always posted as the logged-in
// admin (adminId), never on a user's behalf.
export const createReviewReplySchema = z.object({
  body: z.string().trim().min(2, 'Reply must be at least 2 characters').max(2000),
});

export const reviewReplyIdParamSchema = z.object({
  replyId: z.coerce.number().int().positive(),
});

export type ReviewListQueryParsed = z.infer<typeof reviewListQuerySchema>;
export type UpdateReviewStatusParsed = z.infer<typeof updateReviewStatusSchema>;
export type CreateReviewReplyParsed = z.infer<typeof createReviewReplySchema>;
