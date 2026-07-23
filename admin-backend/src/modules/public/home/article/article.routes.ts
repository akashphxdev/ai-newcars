// src/modules/public/home/article/article.routes.ts
//
// No requireAuth/requirePermission here — this is the public,
// unauthenticated API for the website. Response is cached for 2 min.

import { Router } from 'express';
import { asyncHandler } from '@/core/utils/asyncHandler';
import { publicCache } from '@/core/cache/publicCache';
import { getHomeArticles } from './article.controller';

const router = Router();

router.get('/', publicCache(120), asyncHandler(getHomeArticles));

export default router;
