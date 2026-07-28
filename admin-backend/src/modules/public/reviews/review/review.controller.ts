// src/modules/public/reviews/review/review.controller.ts

import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { ApiError } from '@/core/errors/ApiError';
import { env } from '@/config/env';
import { sendSuccess } from '@/core/utils/sendResponse';
import type { AuthPayload } from '@/core/middleware/auth';
import * as reviewService from './review.service';
import { reviewListQuerySchema, reviewIdParamSchema, createReviewSchema, createReviewReplySchema } from './review.validation';

// The review list is public (anyone can read approved reviews), but a
// logged-in viewer's own helpful-vote state should still show correctly
// — same optional-auth pattern as modules/public/search's tryGetUserId
// (duplicated rather than shared, same module-local reasoning as
// elsewhere in this codebase).
function tryGetUserId(req: Request): number | null {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return null;
  try {
    const decoded = jwt.verify(header.replace('Bearer ', ''), env.jwtSecret) as AuthPayload;
    return decoded.type === 'user' ? decoded.id : null;
  } catch {
    return null;
  }
}

// GET /api/public/v1/reviews?modelId=
export async function getReviews(req: Request, res: Response) {
  const query = reviewListQuerySchema.parse(req.query);
  const result = await reviewService.listReviewsForModel(query, tryGetUserId(req));
  return sendSuccess(res, result, 'Reviews fetched successfully');
}

// POST /api/public/v1/reviews — requires a logged-in user
export async function createReview(req: Request, res: Response) {
  if (!req.auth) {
    throw ApiError.unauthorized();
  }
  const input = createReviewSchema.parse(req.body);
  const result = await reviewService.createReview(input, req.auth.id);
  return sendSuccess(res, result, result.message, 201);
}

// POST /api/public/v1/reviews/:id/helpful — requires a logged-in user
export async function toggleHelpfulVote(req: Request, res: Response) {
  if (!req.auth) {
    throw ApiError.unauthorized();
  }
  const { id } = reviewIdParamSchema.parse(req.params);
  const result = await reviewService.toggleHelpfulVote(id, req.auth.id);
  return sendSuccess(res, result, result.marked ? 'Marked as helpful' : 'Removed helpful mark');
}

// POST /api/public/v1/reviews/:id/replies — requires a logged-in user
export async function createReviewReply(req: Request, res: Response) {
  if (!req.auth) {
    throw ApiError.unauthorized();
  }
  const { id } = reviewIdParamSchema.parse(req.params);
  const input = createReviewReplySchema.parse(req.body);
  const reply = await reviewService.createReviewReply(id, input.body, req.auth.id);
  return sendSuccess(res, reply, 'Reply posted successfully', 201);
}
