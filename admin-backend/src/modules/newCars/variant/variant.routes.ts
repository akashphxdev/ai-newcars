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

// Variant lives under the existing "cars" permission module — same
// module Brand and CarModel use (see MODULES in seedRbac.ts) — not a
// new module of its own.
router.get('/', requirePermission('cars.view'), asyncHandler(getVariants));
router.get('/:id', requirePermission('cars.view'), asyncHandler(getVariantById));
router.post('/', requirePermission('cars.create'), asyncHandler(createVariant));
router.patch('/:id', requirePermission('cars.update'), asyncHandler(updateVariant));
router.delete('/:id', requirePermission('cars.delete'), asyncHandler(deleteVariant));

export default router;