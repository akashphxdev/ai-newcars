// src/modules/public/cars/car/car.routes.ts
//
// No requireAuth/requirePermission here — this is the public,
// unauthenticated API for the website. Response is cached for 3 min
// (cache key includes the full query string, so each type/page gets its
// own cache entry).

import { Router } from 'express';
import { asyncHandler } from '@/core/utils/asyncHandler';
import { publicCache } from '@/core/cache/publicCache';
import { getAllCars } from './car.controller';

const router = Router();

router.get('/', publicCache(180), asyncHandler(getAllCars));

export default router;
