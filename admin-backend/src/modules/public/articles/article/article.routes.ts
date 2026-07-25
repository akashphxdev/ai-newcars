// src/modules/public/articles/article/article.routes.ts
//
// No requireAuth/requirePermission here — this is the public,
// unauthenticated API for the website. Response is cached for 2 min.

import { Router } from 'express';
import { asyncHandler } from '@/core/utils/asyncHandler';
import { publicCache } from '@/core/cache/publicCache';
import { getPublicArticle, getRelatedArticles } from './article.controller';

const router = Router();

router.get('/:categorySlug/:articleSlug', publicCache(120), asyncHandler(getPublicArticle));
// Registered after the 2-segment detail route above — Express only falls
// through to this 1-segment route when the URL doesn't have a second
// segment, so there's no ambiguity between the two.
router.get('/:categorySlug', publicCache(120), asyncHandler(getRelatedArticles));

export default router;
