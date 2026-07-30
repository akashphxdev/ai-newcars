// src/modules/newCars/featureCategory/featureCategory.routes.ts

import { Router } from 'express';
import { requireAuth } from '@/core/middleware/auth';
import { requirePermission } from '@/core/middleware/requirePermission';
import { asyncHandler } from '@/core/utils/asyncHandler';
import {
  getFeatureCategories,
  getFeatureCategoryOptions,
  getFeatureCategoryById,
  createFeatureCategory,
  updateFeatureCategory,
  deleteFeatureCategory,
} from './featureCategory.controller';

const router = Router();

// Every feature-category route requires a logged-in admin.
router.use(requireAuth(['admin']));

router.get('/', requirePermission('feature-categories.view'), asyncHandler(getFeatureCategories));
// Registered before /:id — otherwise Express would match "options" as
// the :id param and this route would never be reached.
router.get('/options', requirePermission('feature-categories.view'), asyncHandler(getFeatureCategoryOptions));
router.get('/:id', requirePermission('feature-categories.view'), asyncHandler(getFeatureCategoryById));
router.post('/', requirePermission('feature-categories.create'), asyncHandler(createFeatureCategory));
router.patch('/:id', requirePermission('feature-categories.update'), asyncHandler(updateFeatureCategory));
router.delete('/:id', requirePermission('feature-categories.delete'), asyncHandler(deleteFeatureCategory));

export default router;
