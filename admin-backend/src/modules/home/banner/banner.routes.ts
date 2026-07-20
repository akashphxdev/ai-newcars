// src/modules/home/banner/banner.routes.ts

import { Router } from 'express';
import { requireAuth } from '@/core/middleware/auth';
import { requirePermission } from '@/core/middleware/requirePermission';
import { mediaUploader } from '@/core/middleware/upload.middleware';
import { asyncHandler } from '@/core/utils/asyncHandler';
import {
  getBanners,
  getBannerById,
  createBanner,
  updateBanner,
  updateBannerStatus,
  uploadBannerMedia,
  deleteBanner,
} from './banner.controller';

const router = Router();

router.use(requireAuth(['admin']));

router.get('/', requirePermission('banners.view'), asyncHandler(getBanners));
router.get('/:id', requirePermission('banners.view'), asyncHandler(getBannerById));
router.post(
  '/',
  requirePermission('banners.create'),
  mediaUploader('banners').single('media'),
  asyncHandler(createBanner),
);
router.patch('/:id', requirePermission('banners.update'), asyncHandler(updateBanner));
// Dedicated quick status-toggle route (Active/Inactive) for the row-level switch.
router.patch('/:id/status', requirePermission('banners.update'), asyncHandler(updateBannerStatus));
// Dedicated media-replace route — main PATCH /:id above stays JSON-only;
// swapping the file (image or video) always goes through here.
router.patch(
  '/:id/media',
  requirePermission('banners.update'),
  mediaUploader('banners').single('media'),
  asyncHandler(uploadBannerMedia),
);
router.delete('/:id', requirePermission('banners.delete'), asyncHandler(deleteBanner));

export default router;
