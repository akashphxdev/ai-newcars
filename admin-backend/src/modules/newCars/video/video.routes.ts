// src/modules/newCars/video/video.routes.ts

import { Router } from 'express';
import { requireAuth } from '@/core/middleware/auth';
import { requirePermission } from '@/core/middleware/requirePermission';
import { imageUploader } from '@/core/middleware/upload.middleware';
import { asyncHandler } from '@/core/utils/asyncHandler';
import {
  getVideos,
  getVideoById,
  createVideo,
  updateVideo,
  updateVideoStatus,
  uploadVideoThumbnail,
  deleteVideo,
} from './video.controller';

const router = Router();

// Every video-management route requires a logged-in admin.
router.use(requireAuth(['admin']));

router.get('/', requirePermission('videos.view'), asyncHandler(getVideos));
router.get('/:id', requirePermission('videos.view'), asyncHandler(getVideoById));
router.post(
  '/',
  requirePermission('videos.create'),
  imageUploader('car-videos').single('thumbnail'),
  asyncHandler(createVideo),
);
router.patch('/:id', requirePermission('videos.update'), asyncHandler(updateVideo));
// Dedicated quick status-toggle route (Active/Inactive) for the row-level switch.
router.patch('/:id/status', requirePermission('videos.update'), asyncHandler(updateVideoStatus));
router.patch(
  '/:id/thumbnail',
  requirePermission('videos.update'),
  imageUploader('car-videos').single('thumbnail'),
  asyncHandler(uploadVideoThumbnail),
);
router.delete('/:id', requirePermission('videos.delete'), asyncHandler(deleteVideo));

export default router;