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

router.use(requireAuth(['admin']));


router.get('/', requirePermission('brands.view'), asyncHandler(getBrands));
router.get('/:id', requirePermission('brands.view'), asyncHandler(getBrandById));
router.post(
  '/',
  requirePermission('brands.create'),
  imageUploader('brands').single('logo'),
  asyncHandler(createBrand),
);
router.patch('/:id', requirePermission('brands.update'), asyncHandler(updateBrand));
// Dedicated quick status-toggle route (Active/Inactive) for the row-level switch.
router.patch('/:id/status', requirePermission('brands.update'), asyncHandler(updateBrandStatus));

router.patch(
  '/:id/logo',
  requirePermission('brands.update'),
  imageUploader('brands').single('logo'),
  asyncHandler(uploadBrandLogo),
)
router.delete('/:id', requirePermission('brands.delete'), asyncHandler(deleteBrand));

export default router;