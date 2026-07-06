// src/modules/locations/district/district.routes.ts

import { Router } from 'express';
import { requireAuth } from '@/core/middleware/auth';
import { requirePermission } from '@/core/middleware/requirePermission';
import { asyncHandler } from '@/core/utils/asyncHandler';
import {
  getDistricts,
  getDistrictById,
  createDistrict,
  updateDistrict,
  deleteDistrict,
} from './district.controller';

const router = Router();

// Every location-management route requires a logged-in admin.
router.use(requireAuth(['admin']));

router.get('/', requirePermission('districts.view'), asyncHandler(getDistricts));
router.get('/:id', requirePermission('districts.view'), asyncHandler(getDistrictById));
router.post('/', requirePermission('districts.create'), asyncHandler(createDistrict));
router.patch('/:id', requirePermission('districts.update'), asyncHandler(updateDistrict));
router.delete('/:id', requirePermission('districts.delete'), asyncHandler(deleteDistrict));

export default router;