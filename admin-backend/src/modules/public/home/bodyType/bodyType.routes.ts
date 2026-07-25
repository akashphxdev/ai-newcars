// src/modules/public/home/bodyType/bodyType.routes.ts
//
// No requireAuth/requirePermission here — this is the public,
// unauthenticated API for the website. Response is cached for 10 min
// (this lookup table changes very rarely).

import { Router } from 'express';
import { asyncHandler } from '@/core/utils/asyncHandler';
import { publicCache } from '@/core/cache/publicCache';
import { getHomeBodyTypes } from './bodyType.controller';

const router = Router();

router.get('/', publicCache(600), asyncHandler(getHomeBodyTypes));

export default router;
