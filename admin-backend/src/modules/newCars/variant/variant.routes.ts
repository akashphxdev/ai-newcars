// src/modules/newCars/variant/variant.routes.ts

import { Router } from 'express';
import { requireAuth } from '@/core/middleware/auth';
import { requirePermission } from '@/core/middleware/requirePermission';
import { asyncHandler } from '@/core/utils/asyncHandler';
import {
  getVariants,
  getVariantOptions,
  getVariantById,
  createVariant,
  updateVariant,
  deleteVariant,
} from './variant.controller';

const router = Router();

// Every variant-management route requires a logged-in admin.
router.use(requireAuth(['admin']));
router.get('/', requirePermission('variants.view'), asyncHandler(getVariants));
// Registered before /:id — otherwise Express would match "options" as
// the :id param and this route would never be reached.
router.get('/options', requirePermission('variants.view'), asyncHandler(getVariantOptions));
router.get('/:id', requirePermission('variants.view'), asyncHandler(getVariantById));
router.post('/', requirePermission('variants.create'), asyncHandler(createVariant));
router.patch('/:id', requirePermission('variants.update'), asyncHandler(updateVariant));
router.delete('/:id', requirePermission('variants.delete'), asyncHandler(deleteVariant));

export default router;