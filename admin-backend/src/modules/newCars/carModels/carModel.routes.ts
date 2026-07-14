// src/modules/newCars/carModels/carModel.routes.ts

import { Router } from 'express';
import { requireAuth } from '@/core/middleware/auth';
import { requirePermission } from '@/core/middleware/requirePermission';
import { imageUploader } from '@/core/middleware/upload.middleware';
import { asyncHandler } from '@/core/utils/asyncHandler';
import {
  getCarModels,
  getCarModelOptions,
  getCarModelById,
  createCarModel,
  updateCarModel,
  updateCarModelLaunchStatus,
  uploadCarModelCoverImage,
  deleteCarModel,
} from './carModel.controller';

const router = Router();

// Every car-model-management route requires a logged-in admin.
router.use(requireAuth(['admin']));

router.get('/', requirePermission('carmodels.view'), asyncHandler(getCarModels));
// Registered before /:id — otherwise Express would match "options" as
// the :id param and this route would never be reached.
router.get('/options', requirePermission('carmodels.view'), asyncHandler(getCarModelOptions));
router.get('/:id', requirePermission('carmodels.view'), asyncHandler(getCarModelById));
// Cover image is required at create time — multipart field name "coverImage".
// Same uploader/validation (jpg/png/webp, 2MB) as the gallery images.
router.post(
  '/',
  requirePermission('carmodels.create'),
  imageUploader('car-model-covers').single('coverImage'),
  asyncHandler(createCarModel),
);
router.patch('/:id', requirePermission('carmodels.update'), asyncHandler(updateCarModel));
// Dedicated quick launch-status-change route for the row-level select.
router.patch('/:id/launch-status', requirePermission('carmodels.update'), asyncHandler(updateCarModelLaunchStatus));
// Dedicated "replace just the cover image" route — mirrors image.routes.ts's
// PATCH /:id/file for the gallery.
router.patch(
  '/:id/cover-image',
  requirePermission('carmodels.update'),
  imageUploader('car-model-covers').single('coverImage'),
  asyncHandler(uploadCarModelCoverImage),
);
router.delete('/:id', requirePermission('carmodels.delete'), asyncHandler(deleteCarModel));

export default router;