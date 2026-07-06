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

router.get('/', requirePermission('colors.view'), asyncHandler(getColors));
router.get('/:id', requirePermission('colors.view'), asyncHandler(getColorById));
router.post('/', requirePermission('colors.create'), imageUploader('colors').single('image'), asyncHandler(createColor));
router.patch('/:id', requirePermission('colors.update'), asyncHandler(updateColor));
router.patch(
  '/:id/image',
  requirePermission('colors.update'),
  imageUploader('colors').single('image'),
  asyncHandler(uploadColorImage),
);
router.delete('/:id', requirePermission('colors.delete'), asyncHandler(deleteColor));

export default router;