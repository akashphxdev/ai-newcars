// src/modules/newCars/faq/faq.routes.ts

import { Router } from 'express';
import { requireAuth } from '@/core/middleware/auth';
import { requirePermission } from '@/core/middleware/requirePermission';
import { asyncHandler } from '@/core/utils/asyncHandler';
import {
  getFaqs,
  getFaqById,
  createFaq,
  updateFaq,
  deleteFaq,
} from './faq.controller';

const router = Router();

// Every FAQ-management route requires a logged-in admin.
router.use(requireAuth(['admin']));

router.get('/', requirePermission('faqs.view'), asyncHandler(getFaqs));
router.get('/:id', requirePermission('faqs.view'), asyncHandler(getFaqById));
router.post('/', requirePermission('faqs.create'), asyncHandler(createFaq));
router.patch('/:id', requirePermission('faqs.update'), asyncHandler(updateFaq));
router.delete('/:id', requirePermission('faqs.delete'), asyncHandler(deleteFaq));

export default router;