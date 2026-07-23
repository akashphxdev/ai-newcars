// src/modules/public/home/brand/brand.routes.ts
//
// No requireAuth/requirePermission here — this is the public,
// unauthenticated API for the website. Response is cached for 5 min.

import { Router } from 'express';
import { asyncHandler } from '@/core/utils/asyncHandler';
import { publicCache } from '@/core/cache/publicCache';
import { getHomeBrands } from './brand.controller';

const router = Router();

router.get('/', publicCache(300), asyncHandler(getHomeBrands));

export default router;
