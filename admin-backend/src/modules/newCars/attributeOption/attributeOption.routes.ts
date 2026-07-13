// src/modules/newCars/attributeOption/attributeOption.routes.ts

import { Router } from 'express';
import { requireAuth } from '@/core/middleware/auth';
import { requirePermission } from '@/core/middleware/requirePermission';
import { asyncHandler } from '@/core/utils/asyncHandler';
import {
  getAttributeOptions,
  getAttributeOptionsGrouped,
  getAttributeOptionById,
  createAttributeOption,
  updateAttributeOption,
  deleteAttributeOption,
} from './attributeOption.controller';

const router = Router();

// Every attribute-option-management route requires a logged-in admin.
router.use(requireAuth(['admin']));

// NOTE: '/grouped' must be registered before '/:id' or Express will try
// to match it as an :id param instead.
router.get('/grouped', requirePermission('attribute-options.view'), asyncHandler(getAttributeOptionsGrouped));
router.get('/', requirePermission('attribute-options.view'), asyncHandler(getAttributeOptions));
router.get('/:id', requirePermission('attribute-options.view'), asyncHandler(getAttributeOptionById));
router.post('/', requirePermission('attribute-options.create'), asyncHandler(createAttributeOption));
router.patch('/:id', requirePermission('attribute-options.update'), asyncHandler(updateAttributeOption));
router.delete('/:id', requirePermission('attribute-options.delete'), asyncHandler(deleteAttributeOption));

export default router;