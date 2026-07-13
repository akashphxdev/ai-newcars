// src/modules/newCars/bodyType/bodyType.routes.ts

import { Router } from 'express';
import { requireAuth } from '@/core/middleware/auth';
import { requirePermission } from '@/core/middleware/requirePermission';
import { imageUploader } from '@/core/middleware/upload.middleware';
import { asyncHandler } from '@/core/utils/asyncHandler';
import {
  getBodyTypes,
  getBodyTypeById,
  createBodyType,
  updateBodyType,
  uploadBodyTypeIcon,
  deleteBodyType,
} from './bodyType.controller';

const router = Router();

// Every body-type-management route requires a logged-in admin.
router.use(requireAuth(['admin']));

router.get('/', requirePermission('bodytypes.view'), asyncHandler(getBodyTypes));
router.get('/:id', requirePermission('bodytypes.view'), asyncHandler(getBodyTypeById));
router.post(
  '/',
  requirePermission('bodytypes.create'),
  imageUploader('bodytypes').single('icon'),
  asyncHandler(createBodyType),
);
router.patch('/:id', requirePermission('bodytypes.update'), asyncHandler(updateBodyType));
router.patch(
  '/:id/icon',
  requirePermission('bodytypes.update'),
  imageUploader('bodytypes').single('icon'),
  asyncHandler(uploadBodyTypeIcon),
);
router.delete('/:id', requirePermission('bodytypes.delete'), asyncHandler(deleteBodyType));

export default router;