// src/modules/reviews/review/review.routes.ts

import { Router } from 'express';
import { requireAuth } from '@/core/middleware/auth';
import { requirePermission } from '@/core/middleware/requirePermission';
import { asyncHandler } from '@/core/utils/asyncHandler';
import {
  getReviews,
  getReviewById,
  updateReviewStatus,
  deleteReview,
  createReviewReply,
  deleteReviewReply,
} from './review.controller';

const router = Router();

// Every review-management route requires a logged-in admin.
router.use(requireAuth(['admin']));

router.get('/', requirePermission('reviews.view'), asyncHandler(getReviews));
router.get('/:id', requirePermission('reviews.view'), asyncHandler(getReviewById));
router.patch('/:id/status', requirePermission('reviews.moderate'), asyncHandler(updateReviewStatus));
router.delete('/:id', requirePermission('reviews.delete'), asyncHandler(deleteReview));

// Reply actions live here (not a separate module) — there's no
// dedicated "all replies across every review" admin view, just
// post/delete from within a review's own expanded row.
router.post('/:id/replies', requirePermission('reviews.moderate'), asyncHandler(createReviewReply));
router.delete('/replies/:replyId', requirePermission('reviews.moderate'), asyncHandler(deleteReviewReply));

export default router;
