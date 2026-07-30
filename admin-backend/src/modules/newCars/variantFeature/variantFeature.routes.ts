// src/modules/newCars/variantFeature/variantFeature.routes.ts

import { Router } from 'express';
import { requireAuth } from '@/core/middleware/auth';
import { requirePermission } from '@/core/middleware/requirePermission';
import { asyncHandler } from '@/core/utils/asyncHandler';
import {
  getVariantsWithFeatures,
  getFeatureCatalog,
  getVariantFeatures,
  syncVariantFeatures,
} from './variantFeature.controller';

const router = Router();

// Every variant-feature route requires a logged-in admin.
router.use(requireAuth(['admin']));

router.get('/', requirePermission('variant-features.view'), asyncHandler(getVariantsWithFeatures));
// Registered before /:variantId — otherwise Express would match
// "catalog" as the :variantId param.
router.get('/catalog', requirePermission('variant-features.view'), asyncHandler(getFeatureCatalog));
router.get('/:variantId', requirePermission('variant-features.view'), asyncHandler(getVariantFeatures));
router.put('/:variantId', requirePermission('variant-features.update'), asyncHandler(syncVariantFeatures));

export default router;
