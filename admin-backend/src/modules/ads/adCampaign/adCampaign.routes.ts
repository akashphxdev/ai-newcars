// src/modules/ads/adCampaign/adCampaign.routes.ts

import { Router } from 'express';
import { requireAuth } from '@/core/middleware/auth';
import { requirePermission } from '@/core/middleware/requirePermission';
import { imageUploader } from '@/core/middleware/upload.middleware';
import { asyncHandler } from '@/core/utils/asyncHandler';
import {
  getAdCampaigns,
  getAdCampaignById,
  createAdCampaign,
  updateAdCampaign,
  updateAdCampaignStatus,
  deleteAdCampaign,
} from './adCampaign.controller';

const router = Router();

// Every campaign-management route requires a logged-in admin.
router.use(requireAuth(['admin']));

router.get('/', requirePermission('ad-campaigns.view'), asyncHandler(getAdCampaigns));
router.get('/:id', requirePermission('ad-campaigns.view'), asyncHandler(getAdCampaignById));
router.post(
  '/',
  requirePermission('ad-campaigns.create'),
  imageUploader('ad-campaigns').single('creativeImage'),
  asyncHandler(createAdCampaign),
);
router.patch(
  '/:id',
  requirePermission('ad-campaigns.update'),
  imageUploader('ad-campaigns').single('creativeImage'),
  asyncHandler(updateAdCampaign),
);
// Dedicated quick-toggle route for the row-level status switch (mirrors
// adPlacement.routes.ts's PATCH /:id/status pattern).
router.patch('/:id/status', requirePermission('ad-campaigns.update'), asyncHandler(updateAdCampaignStatus));
router.delete('/:id', requirePermission('ad-campaigns.delete'), asyncHandler(deleteAdCampaign));

export default router;
