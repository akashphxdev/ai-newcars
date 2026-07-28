// src/modules/reviews/review/review.controller.ts

import { Request, Response } from 'express';
import { ApiError } from '@/core/errors/ApiError';
import { sendSuccess, sendPaginated } from '@/core/utils/sendResponse';
import { getClientIp } from '@/core/utils/getClientIp';
import * as reviewService from './review.service';
import {
  reviewListQuerySchema,
  reviewIdParamSchema,
  updateReviewStatusSchema,
  createReviewReplySchema,
  reviewReplyIdParamSchema,
} from './review.validation';

// GET /reviews
export async function getReviews(req: Request, res: Response) {
  const query = reviewListQuerySchema.parse(req.query);
  const result = await reviewService.listReviews(query);
  return sendPaginated(res, result.items, result.pagination, 'Reviews fetched successfully');
}

// GET /reviews/:id
export async function getReviewById(req: Request, res: Response) {
  const { id } = reviewIdParamSchema.parse(req.params);
  const review = await reviewService.getReviewById(id);
  return sendSuccess(res, review, 'Review fetched successfully');
}

// PATCH /reviews/:id/status
export async function updateReviewStatus(req: Request, res: Response) {
  const { id } = reviewIdParamSchema.parse(req.params);
  const input = updateReviewStatusSchema.parse(req.body);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const review = await reviewService.updateReviewStatus(id, input, req.auth.id, getClientIp(req));
  return sendSuccess(res, review, 'Review status updated successfully');
}

// DELETE /reviews/:id
export async function deleteReview(req: Request, res: Response) {
  const { id } = reviewIdParamSchema.parse(req.params);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const result = await reviewService.deleteReview(id, req.auth.id, getClientIp(req));
  return sendSuccess(res, null, result.message);
}

// POST /reviews/:id/replies
export async function createReviewReply(req: Request, res: Response) {
  const { id } = reviewIdParamSchema.parse(req.params);
  const input = createReviewReplySchema.parse(req.body);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const reply = await reviewService.createReviewReply(id, input, req.auth.id, getClientIp(req));
  return sendSuccess(res, reply, 'Reply posted successfully', 201);
}

// DELETE /reviews/replies/:replyId
export async function deleteReviewReply(req: Request, res: Response) {
  const { replyId } = reviewReplyIdParamSchema.parse(req.params);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const result = await reviewService.deleteReviewReply(replyId, req.auth.id, getClientIp(req));
  return sendSuccess(res, null, result.message);
}
