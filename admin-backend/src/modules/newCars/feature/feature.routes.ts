// src/modules/newCars/feature/feature.routes.ts

import { Router } from 'express';
import { requireAuth } from '@/core/middleware/auth';
import { requirePermission } from '@/core/middleware/requirePermission';
import { asyncHandler } from '@/core/utils/asyncHandler';
import {
  getFeatures,
  getFeatureOptions,
  getFeatureById,
  createFeature,
  updateFeature,
  deleteFeature,
} from './feature.controller';

const router = Router();

// Every feature route requires a logged-in admin.
router.use(requireAuth(['admin']));

router.get('/', requirePermission('features.view'), asyncHandler(getFeatures));
// Registered before /:id — otherwise Express would match "options" as
// the :id param and this route would never be reached.
router.get('/options', requirePermission('features.view'), asyncHandler(getFeatureOptions));
router.get('/:id', requirePermission('features.view'), asyncHandler(getFeatureById));
router.post('/', requirePermission('features.create'), asyncHandler(createFeature));
router.patch('/:id', requirePermission('features.update'), asyncHandler(updateFeature));
router.delete('/:id', requirePermission('features.delete'), asyncHandler(deleteFeature));

export default router;
