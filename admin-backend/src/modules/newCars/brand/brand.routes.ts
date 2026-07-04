// src/modules/cars/brand/brand.routes.ts

import { Router } from 'express';
import { requireAuth } from '@/core/middleware/auth';
import { requirePermission } from '@/core/middleware/requirePermission';
import { imageUploader } from '@/core/middleware/upload.middleware';
import { asyncHandler } from '@/core/utils/asyncHandler';
import {
  getBrands,
  getBrandById,
  createBrand,
  updateBrand,
  updateBrandStatus,
  uploadBrandLogo,
  deleteBrand,
} from './brand.controller';

const router = Router();

// Every brand-management route requires a logged-in admin.
router.use(requireAuth(['admin']));

// Brand lives under the existing "cars" permission module
// (see MODULES in prisma/seedRbac.ts) — not a new module of its own.
router.get('/', requirePermission('cars.view'), asyncHandler(getBrands));
router.get('/:id', requirePermission('cars.view'), asyncHandler(getBrandById));
router.post(
  '/',
  requirePermission('cars.create'),
  imageUploader('brands').single('logo'),
  asyncHandler(createBrand),
);
router.patch('/:id', requirePermission('cars.update'), asyncHandler(updateBrand));
// Dedicated quick status-toggle route (Active/Inactive) for the row-level switch.
router.patch('/:id/status', requirePermission('cars.update'), asyncHandler(updateBrandStatus));

router.patch(
  '/:id/logo',
  requirePermission('cars.update'),
  imageUploader('brands').single('logo'),
  asyncHandler(uploadBrandLogo),
);
router.delete('/:id', requirePermission('cars.delete'), asyncHandler(deleteBrand));

export default router;