// src/modules/public/cars/car/car.routes.ts
//
// No requireAuth/requirePermission here — this is the public,
// unauthenticated API for the website. Response is cached for 3 min
// (cache key includes the full query string, so each type/page gets its
// own cache entry).

import { Router } from 'express';
import { asyncHandler } from '@/core/utils/asyncHandler';
import { publicCache } from '@/core/cache/publicCache';
import {
  getAllCars,
  getCarsBrowse,
  getModelsByBrand,
  getVariantsByModel,
  getCarDetail,
  getCarImages,
  getCarFaqs,
  getCarArticles,
  getCarVariants,
} from './car.controller';

const router = Router();

router.get('/', publicCache(180), asyncHandler(getAllCars));
router.get('/browse', publicCache(180), asyncHandler(getCarsBrowse));
// Registered before /:brandSlug/:modelSlug — otherwise Express would
// match "lookup" as brandSlug and "models"/"variants" as modelSlug.
router.get('/lookup/models', publicCache(180), asyncHandler(getModelsByBrand));
router.get('/lookup/variants', publicCache(180), asyncHandler(getVariantsByModel));
// Two path segments — registered after the single-segment routes above so
// Express doesn't need to disambiguate; no ordering conflict either way.
router.get('/:brandSlug/:modelSlug', publicCache(180), asyncHandler(getCarDetail));
// Three path segments (literal last segment) — the "/photos" page and the
// FAQs section each get their own lean payload instead of riding on the
// full getCarDetail response.
router.get('/:brandSlug/:modelSlug/images', publicCache(180), asyncHandler(getCarImages));
router.get('/:brandSlug/:modelSlug/faqs', publicCache(180), asyncHandler(getCarFaqs));
router.get('/:brandSlug/:modelSlug/articles', publicCache(180), asyncHandler(getCarArticles));
router.get('/:brandSlug/:modelSlug/variants', publicCache(180), asyncHandler(getCarVariants));

export default router;
