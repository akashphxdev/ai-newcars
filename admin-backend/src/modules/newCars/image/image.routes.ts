// src/modules/newCars/image/image.routes.ts

import { Router } from 'express';
import { requireAuth } from '@/core/middleware/auth';
import { requirePermission } from '@/core/middleware/requirePermission';
import { imageUploader } from '@/core/middleware/upload.middleware';
import { asyncHandler } from '@/core/utils/asyncHandler';
import {
  getImages,
  getImageById,
  createImage,
  updateImage,
  setPrimaryImage,
  replaceImageFile,
  deleteImage,
} from './image.controller';

const router = Router();

// Every image-management route requires a logged-in admin.
router.use(requireAuth(['admin']));

router.get('/', requirePermission('images.view'), asyncHandler(getImages));
router.get('/:id', requirePermission('images.view'), asyncHandler(getImageById));
router.post('/', requirePermission('images.create'), imageUploader('car-images').single('image'), asyncHandler(createImage));
router.patch('/:id', requirePermission('images.update'), asyncHandler(updateImage));
// Dedicated quick "set as cover" toggle for the gallery's row-level action.
router.patch('/:id/set-primary', requirePermission('images.update'), asyncHandler(setPrimaryImage));
router.patch(
  '/:id/file',
  requirePermission('images.update'),
  imageUploader('car-images').single('image'),
  asyncHandler(replaceImageFile),
);
router.delete('/:id', requirePermission('images.delete'), asyncHandler(deleteImage));

export default router;