// src/modules/public/home/banner/banner.routes.ts
//
// No requireAuth/requirePermission here — this is the public,
// unauthenticated API for the website. Response is cached for 60s.

import { Router } from 'express';
import { asyncHandler } from '@/core/utils/asyncHandler';
import { publicCache } from '@/core/cache/publicCache';
import { getBanners, recordBannerClick } from './banner.controller';

const router = Router();

router.get('/', publicCache(60), asyncHandler(getBanners));
// Never cached — every call must reach the DB to actually increment.
router.patch('/:id/click', asyncHandler(recordBannerClick));

export default router;
