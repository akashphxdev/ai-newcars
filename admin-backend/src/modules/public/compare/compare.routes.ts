// src/modules/public/compare/compare.routes.ts
//
// No requireAuth/requirePermission here — public, unauthenticated API
// for the website's Compare feature. Cache key includes the query
// string, so each carA/carB/variant combo (and each random-pairs filter
// combo) gets its own cache entry.

import { Router } from 'express';
import { asyncHandler } from '@/core/utils/asyncHandler';
import { publicCache } from '@/core/cache/publicCache';
import {
  getCompareData,
  getCarOptions,
  getCarVariantOptions,
  getVariantPowertrainOptions,
  getRandomPairs,
  getBrandCrossPairs,
  getModelCrossPairs,
} from './compare.controller';

const router = Router();

router.get('/', publicCache(300), asyncHandler(getCompareData));
router.get('/random-pairs', publicCache(180), asyncHandler(getRandomPairs));
router.get('/brand-cross-pairs', publicCache(180), asyncHandler(getBrandCrossPairs));
router.get('/model-cross-pairs', publicCache(180), asyncHandler(getModelCrossPairs));
router.get('/car-options', publicCache(300), asyncHandler(getCarOptions));
router.get('/car-options/:slug/variants', publicCache(300), asyncHandler(getCarVariantOptions));
router.get('/car-options/:slug/variants/:variantId/powertrains', publicCache(300), asyncHandler(getVariantPowertrainOptions));

export default router;
