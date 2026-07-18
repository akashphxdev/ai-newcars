// src/modules/ai/imagePool/imagePool.routes.ts

import { Router } from 'express';
import { requireAuth } from '@/core/middleware/auth';
import { requirePermission } from '@/core/middleware/requirePermission';
import { asyncHandler } from '@/core/utils/asyncHandler';
import { imageUploader } from '@/core/middleware/upload.middleware';
import { getImagePool, uploadImagePool, deleteImagePool } from './imagePool.controller';

const MAX_FILES_PER_UPLOAD = 20;

const router = Router();

router.use(requireAuth(['admin']));

router.get('/', requirePermission('ai.image-pool.view'), asyncHandler(getImagePool));

router.post(
  '/upload',
  requirePermission('ai.image-pool.upload'),
  imageUploader('ai-pool').array('images', MAX_FILES_PER_UPLOAD),
  asyncHandler(uploadImagePool),
);

router.delete('/:id', requirePermission('ai.image-pool.delete'), asyncHandler(deleteImagePool));

export default router;