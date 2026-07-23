// src/modules/public/home/car/car.routes.ts
//
// No requireAuth/requirePermission here — this is the public,
// unauthenticated API for the website. `type` query param serves
// LatestCars / PopularCars / UpcomingLaunches / ElectricCars from one
// endpoint. Response is cached for 3 min (cache key includes the full
// query string, so each `type` gets its own cache entry).

import { Router } from 'express';
import { asyncHandler } from '@/core/utils/asyncHandler';
import { publicCache } from '@/core/cache/publicCache';
import { getHomeCars } from './car.controller';

const router = Router();

router.get('/', publicCache(180), asyncHandler(getHomeCars));

export default router;
