// src/modules/public/reviews/review/review.routes.ts
//
// Public API for the website's model-page reviews section. Reading is
// fully unauthenticated; posting a review/reply or marking one helpful
// requires a logged-in user (never an admin token here — that's the
// separate admin-authenticated modules/reviews/review module).

import { Router } from 'express';
import { requireAuth } from '@/core/middleware/auth';
import { asyncHandler } from '@/core/utils/asyncHandler';
import { publicCache } from '@/core/cache/publicCache';
import { getReviews, createReview, toggleHelpfulVote, createReviewReply } from './review.controller';

const router = Router();

// Cached like every other public GET — publicCache itself skips the
// cache whenever a Bearer token is present, so a logged-in viewer's own
// hasMarkedHelpful state never gets served to a different caller.
router.get('/', publicCache(180), asyncHandler(getReviews));
router.post('/', requireAuth(['user']), asyncHandler(createReview));
router.post('/:id/helpful', requireAuth(['user']), asyncHandler(toggleHelpfulVote));
router.post('/:id/replies', requireAuth(['user']), asyncHandler(createReviewReply));

export default router;
