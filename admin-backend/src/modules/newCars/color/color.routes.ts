// src/modules/newCars/color/color.routes.ts

import { Router } from 'express';
import { requireAuth } from '@/core/middleware/auth';
import { requirePermission } from '@/core/middleware/requirePermission';
import { imageUploader } from '@/core/middleware/upload.middleware';
import { asyncHandler } from '@/core/utils/asyncHandler';
import { getColors, getColorById, createColor, updateColor, uploadColorImage, deleteColor } from './color.controller';

const router = Router();

// Every color-management route requires a logged-in admin.
router.use(requireAuth(['admin']));

// Colors live under the existing "cars" permission module (see MODULES
// in prisma/seedRbac.ts) — same convention as brand/carModel/variant.
router.get('/', requirePermission('cars.view'), asyncHandler(getColors));
router.get('/:id', requirePermission('cars.view'), asyncHandler(getColorById));
router.post('/', requirePermission('cars.create'), imageUploader('colors').single('image'), asyncHandler(createColor));
router.patch('/:id', requirePermission('cars.update'), asyncHandler(updateColor));
router.patch(
  '/:id/image',
  requirePermission('cars.update'),
  imageUploader('colors').single('image'),
  asyncHandler(uploadColorImage),
);
router.delete('/:id', requirePermission('cars.delete'), asyncHandler(deleteColor));

export default router;