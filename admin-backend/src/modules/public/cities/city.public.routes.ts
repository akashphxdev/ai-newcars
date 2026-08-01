// src/modules/public/cities/city.public.routes.ts

import { Router } from 'express';
import { publicCache } from '@/core/cache/publicCache';
import { asyncHandler } from '@/core/utils/asyncHandler';
import { getPublicCityOptions } from './city.public.controller';

const router = Router();

// City list changes rarely — same 300s TTL as other public lookup lists
// (brands, body types).
router.get('/options', publicCache(300), asyncHandler(getPublicCityOptions));

export default router;
