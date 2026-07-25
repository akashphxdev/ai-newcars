// src/modules/public/home/story/story.routes.ts
//
// No requireAuth/requirePermission here — this is the public,
// unauthenticated API for the website. Response is cached for 2 min.

import { Router } from 'express';
import { asyncHandler } from '@/core/utils/asyncHandler';
import { publicCache } from '@/core/cache/publicCache';
import { getHomeStories } from './story.controller';

const router = Router();

router.get('/', publicCache(120), asyncHandler(getHomeStories));

export default router;
