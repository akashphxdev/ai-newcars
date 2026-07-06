// src/modules/newCars/variant/variant.routes.ts

import { Router } from 'express';
import { requireAuth } from '@/core/middleware/auth';
import { requirePermission } from '@/core/middleware/requirePermission';
import { asyncHandler } from '@/core/utils/asyncHandler';
import {
  getVariants,
  getVariantById,
  createVariant,
  updateVariant,
  deleteVariant,
} from './variant.controller';

const router = Router();

// Every variant-management route requires a logged-in admin.
router.use(requireAuth(['admin']));
router.get('/', requirePermission('variants.view'), asyncHandler(getVariants));
router.get('/:id', requirePermission('variants.view'), asyncHandler(getVariantById));
router.post('/', requirePermission('variants.create'), asyncHandler(createVariant));
router.patch('/:id', requirePermission('variants.update'), asyncHandler(updateVariant));
router.delete('/:id', requirePermission('variants.delete'), asyncHandler(deleteVariant));

export default router;