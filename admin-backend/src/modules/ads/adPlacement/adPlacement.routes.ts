// src/modules/ads/adPlacement/adPlacement.routes.ts

import { Router } from 'express';
import { requireAuth } from '@/core/middleware/auth';
import { requirePermission } from '@/core/middleware/requirePermission';
import { asyncHandler } from '@/core/utils/asyncHandler';
import {
  getAdPlacements,
  getAdPlacementById,
  createAdPlacement,
  updateAdPlacement,
  updateAdPlacementStatus,
  deleteAdPlacement,
} from './adPlacement.controller';

const router = Router();

// Every ad-placement-management route requires a logged-in admin.
router.use(requireAuth(['admin']));

router.get('/', requirePermission('ad-placements.view'), asyncHandler(getAdPlacements));
router.get('/:id', requirePermission('ad-placements.view'), asyncHandler(getAdPlacementById));
router.post('/', requirePermission('ad-placements.create'), asyncHandler(createAdPlacement));
router.patch('/:id', requirePermission('ad-placements.update'), asyncHandler(updateAdPlacement));
// Dedicated quick-toggle route for the row-level status switch (mirrors
// articleCategory.routes.ts's PATCH /:id/status pattern).
router.patch('/:id/status', requirePermission('ad-placements.update'), asyncHandler(updateAdPlacementStatus));
router.delete('/:id', requirePermission('ad-placements.delete'), asyncHandler(deleteAdPlacement));

export default router;