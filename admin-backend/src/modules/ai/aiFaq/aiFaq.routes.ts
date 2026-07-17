// src/modules/ai/aiFaq/aiFaq.routes.ts

import { Router } from 'express';
import { requireAuth } from '@/core/middleware/auth';
import { requirePermission } from '@/core/middleware/requirePermission';
import { asyncHandler } from '@/core/utils/asyncHandler';
import {
  getAiFaqs,
  getAiFaqById,
  updateAiFaq,
  approveAiFaq,
  rejectAiFaq,
  publishAiFaq,
  deleteAiFaq,
} from './aiFaq.controller';

const router = Router();

router.use(requireAuth(['admin']));

router.get('/', requirePermission('ai.faqs.view'), asyncHandler(getAiFaqs));
router.get('/:id', requirePermission('ai.faqs.view'), asyncHandler(getAiFaqById));
router.patch('/:id', requirePermission('ai.faqs.update'), asyncHandler(updateAiFaq));
router.patch('/:id/approve', requirePermission('ai.faqs.update'), asyncHandler(approveAiFaq));
router.patch('/:id/reject', requirePermission('ai.faqs.update'), asyncHandler(rejectAiFaq));
router.patch('/:id/publish', requirePermission('ai.faqs.update'), asyncHandler(publishAiFaq));
router.delete('/:id', requirePermission('ai.faqs.delete'), asyncHandler(deleteAiFaq));

export default router;
