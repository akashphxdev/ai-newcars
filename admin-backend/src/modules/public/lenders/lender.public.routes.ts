// src/modules/public/lenders/lender.public.routes.ts

import { Router } from 'express';
import { publicCache } from '@/core/cache/publicCache';
import { asyncHandler } from '@/core/utils/asyncHandler';
import { getPublicLenderOptions } from './lender.public.controller';

const router = Router();

// Lender list changes rarely — same 300s TTL as city/state options.
router.get('/options', publicCache(300), asyncHandler(getPublicLenderOptions));

export default router;
