// src/modules/public/home/city/city.routes.ts
//
// No requireAuth/requirePermission here — this is the public,
// unauthenticated API for the website. Response is cached for 10 min
// (top-city flags change rarely).

import { Router } from 'express';
import { asyncHandler } from '@/core/utils/asyncHandler';
import { publicCache } from '@/core/cache/publicCache';
import { getHomeCities } from './city.controller';

const router = Router();

router.get('/', publicCache(600), asyncHandler(getHomeCities));

export default router;
