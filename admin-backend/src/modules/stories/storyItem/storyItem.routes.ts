// src/modules/stories/storyItem/storyItem.routes.ts

import { Router } from 'express';
import { requireAuth } from '@/core/middleware/auth';
import { requirePermission } from '@/core/middleware/requirePermission';
import { imageUploader } from '@/core/middleware/upload.middleware';
import { asyncHandler } from '@/core/utils/asyncHandler';
import {
  getStoryItems,
  getStoryItemById,
  createStoryItem,
  updateStoryItem,
  updateStoryItemStatus,
  uploadStoryItemMedia,
  deleteStoryItem,
  incrementStoryItemViewCount,
} from './storyItem.controller';

const router = Router();

// Public — the consumer-facing site calls this to bump the view count
// whenever a visitor views this individual slide. Placed BEFORE
// requireAuth below so it stays unauthenticated.
router.patch('/:id/view', asyncHandler(incrementStoryItemViewCount));

// Every other story-item route requires a logged-in admin.
router.use(requireAuth(['admin']));

router.get('/', requirePermission('story-items.view'), asyncHandler(getStoryItems));
router.get('/:id', requirePermission('story-items.view'), asyncHandler(getStoryItemById));
router.post(
  '/',
  requirePermission('story-items.create'),
  imageUploader('story-items').single('media'),
  asyncHandler(createStoryItem),
);
router.patch('/:id', requirePermission('story-items.update'), asyncHandler(updateStoryItem));
// Dedicated quick status-toggle route (Active/Inactive) for the row-level switch.
router.patch('/:id/status', requirePermission('story-items.update'), asyncHandler(updateStoryItemStatus));
// Dedicated media-replace route — main PATCH /:id above stays JSON-only for video links.
router.patch(
  '/:id/media',
  requirePermission('story-items.update'),
  imageUploader('story-items').single('media'),
  asyncHandler(uploadStoryItemMedia),
);
router.delete('/:id', requirePermission('story-items.delete'), asyncHandler(deleteStoryItem));

export default router;