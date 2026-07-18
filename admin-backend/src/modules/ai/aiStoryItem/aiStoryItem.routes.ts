// src/modules/ai/aiStoryItem/aiStoryItem.routes.ts

import { Router } from 'express';
import { requireAuth } from '@/core/middleware/auth';
import { requirePermission } from '@/core/middleware/requirePermission';
import { asyncHandler } from '@/core/utils/asyncHandler';
import {
  getAiStoryItems,
  getAiStoryItemById,
  updateAiStoryItem,
  approveAiStoryItem,
  rejectAiStoryItem,
  publishAiStoryItem,
  deleteAiStoryItem,
} from './aiStoryItem.controller';

const router = Router();

router.use(requireAuth(['admin']));

router.get('/', requirePermission('ai.story-items.view'), asyncHandler(getAiStoryItems));
router.get('/:id', requirePermission('ai.story-items.view'), asyncHandler(getAiStoryItemById));
router.patch('/:id', requirePermission('ai.story-items.update'), asyncHandler(updateAiStoryItem));
router.patch('/:id/approve', requirePermission('ai.story-items.update'), asyncHandler(approveAiStoryItem));
router.patch('/:id/reject', requirePermission('ai.story-items.update'), asyncHandler(rejectAiStoryItem));
router.patch('/:id/publish', requirePermission('ai.story-items.update'), asyncHandler(publishAiStoryItem));
router.delete('/:id', requirePermission('ai.story-items.delete'), asyncHandler(deleteAiStoryItem));

export default router;
