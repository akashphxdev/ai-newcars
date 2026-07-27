// src/modules/public/bodyTypes/bodyType/bodyType.routes.ts
//
// No requireAuth/requirePermission here — public, unauthenticated API.

import { Router } from 'express';
import { asyncHandler } from '@/core/utils/asyncHandler';
import { publicCache } from '@/core/cache/publicCache';
import { getAllBodyTypes, getBodyTypeBySlug, getBodyTypeCars } from './bodyType.controller';

const router = Router();

router.get('/', publicCache(300), asyncHandler(getAllBodyTypes));
router.get('/:slug', publicCache(300), asyncHandler(getBodyTypeBySlug));
router.get('/:slug/cars', publicCache(180), asyncHandler(getBodyTypeCars));

export default router;
