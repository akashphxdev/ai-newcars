// src/modules/stories/storyGroup/storyGroup.routes.ts

import { Router } from 'express';
import { requireAuth } from '@/core/middleware/auth';
import { requirePermission } from '@/core/middleware/requirePermission';
import { imageUploader } from '@/core/middleware/upload.middleware';
import { asyncHandler } from '@/core/utils/asyncHandler';
import {
  getStoryGroups,
  getStoryGroupById,
  createStoryGroup,
  updateStoryGroup,
  updateStoryGroupStatus,
  uploadStoryGroupCover,
  deleteStoryGroup,
  incrementStoryGroupViewCount,
} from './storyGroup.controller';

const router = Router();

router.patch('/:id/view', asyncHandler(incrementStoryGroupViewCount));

// Every other story-group route requires a logged-in admin.
router.use(requireAuth(['admin']));

router.get('/', requirePermission('story-groups.view'), asyncHandler(getStoryGroups));
router.get('/:id', requirePermission('story-groups.view'), asyncHandler(getStoryGroupById));
router.post(
  '/',
  requirePermission('story-groups.create'),
  imageUploader('story-groups').single('cover'),
  asyncHandler(createStoryGroup),
);
router.patch('/:id', requirePermission('story-groups.update'), asyncHandler(updateStoryGroup));
// Dedicated quick status-toggle route (Active/Inactive) for the row-level switch.
router.patch('/:id/status', requirePermission('story-groups.update'), asyncHandler(updateStoryGroupStatus));
// Dedicated cover-replace route — main PATCH /:id above stays JSON-only for video links.
router.patch(
  '/:id/cover',
  requirePermission('story-groups.update'),
  imageUploader('story-groups').single('cover'),
  asyncHandler(uploadStoryGroupCover),
);
router.delete('/:id', requirePermission('story-groups.delete'), asyncHandler(deleteStoryGroup));

export default router;