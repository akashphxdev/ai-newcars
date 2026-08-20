// src/modules/public/cities/city.public.routes.ts

import { Router } from 'express';
import { publicCache } from '@/core/cache/publicCache';
import { asyncHandler } from '@/core/utils/asyncHandler';
import { getPublicCityOptions } from './city.public.controller';

const router = Router();

// City list changes rarely — same 300s TTL as other public lookup lists
// (brands, body types).
// publicCache keys on the full URL, so ?sellCarOnly=true caches
// separately from the unfiltered list rather than colliding with it.
router.get('/options', publicCache(300), asyncHandler(getPublicCityOptions));

export default router;
