// src/modules/newCars/video/video.routes.ts

import { Router } from 'express';
import { requireAuth } from '@/core/middleware/auth';
import { requirePermission } from '@/core/middleware/requirePermission';
import { asyncHandler } from '@/core/utils/asyncHandler';
import {
  getVideos,
  getVideoById,
  createVideo,
  updateVideo,
  deleteVideo,
} from './video.controller';

const router = Router();

// Every video-management route requires a logged-in admin.
router.use(requireAuth(['admin']));
router.get('/', requirePermission('videos.view'), asyncHandler(getVideos));
router.get('/:id', requirePermission('videos.view'), asyncHandler(getVideoById));
router.post('/', requirePermission('videos.create'), asyncHandler(createVideo));
router.patch('/:id', requirePermission('videos.update'), asyncHandler(updateVideo));
router.delete('/:id', requirePermission('videos.delete'), asyncHandler(deleteVideo));

export default router;