// src/modules/ads/advertiser/advertiser.routes.ts

import { Router } from 'express';
import { requireAuth } from '@/core/middleware/auth';
import { requirePermission } from '@/core/middleware/requirePermission';
import { asyncHandler } from '@/core/utils/asyncHandler';
import {
  getAdvertisers,
  getAdvertiserById,
  createAdvertiser,
  updateAdvertiser,
  updateAdvertiserStatus,
  deleteAdvertiser,
} from './advertiser.controller';

const router = Router();

// Every advertiser-management route requires a logged-in admin.
router.use(requireAuth(['admin']));

router.get('/', requirePermission('ad-advertisers.view'), asyncHandler(getAdvertisers));
router.get('/:id', requirePermission('ad-advertisers.view'), asyncHandler(getAdvertiserById));
router.post('/', requirePermission('ad-advertisers.create'), asyncHandler(createAdvertiser));
router.patch('/:id', requirePermission('ad-advertisers.update'), asyncHandler(updateAdvertiser));
// Dedicated quick-toggle route for the row-level status switch (mirrors
// adPlacement.routes.ts's PATCH /:id/status pattern).
router.patch('/:id/status', requirePermission('ad-advertisers.update'), asyncHandler(updateAdvertiserStatus));
router.delete('/:id', requirePermission('ad-advertisers.delete'), asyncHandler(deleteAdvertiser));

export default router;