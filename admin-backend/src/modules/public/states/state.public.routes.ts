// src/modules/public/states/state.public.routes.ts

import { Router } from 'express';
import { publicCache } from '@/core/cache/publicCache';
import { asyncHandler } from '@/core/utils/asyncHandler';
import { getPublicStateOptions } from './state.public.controller';

const router = Router();

// State list changes rarely — same 300s TTL as city options.
router.get('/options', publicCache(300), asyncHandler(getPublicStateOptions));

export default router;
