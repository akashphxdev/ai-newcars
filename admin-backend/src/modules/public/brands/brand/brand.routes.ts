// src/modules/public/brands/brand/brand.routes.ts
//
// No requireAuth/requirePermission here — this is the public,
// unauthenticated API for the website. Response is cached for 5 min.

import { Router } from 'express';
import { asyncHandler } from '@/core/utils/asyncHandler';
import { publicCache } from '@/core/cache/publicCache';
import { getAllBrands, getAllBrandsWithCounts, getBrandBySlug, getBrandCars, getBrandArticles } from './brand.controller';

const router = Router();

router.get('/', publicCache(300), asyncHandler(getAllBrands));
// Must be registered before '/:slug' — otherwise Express would match
// "with-counts" as a brand slug instead of this literal route.
router.get('/with-counts', publicCache(300), asyncHandler(getAllBrandsWithCounts));
router.get('/:slug', publicCache(300), asyncHandler(getBrandBySlug));
router.get('/:slug/cars', publicCache(180), asyncHandler(getBrandCars));
router.get('/:slug/articles', publicCache(300), asyncHandler(getBrandArticles));

export default router;
