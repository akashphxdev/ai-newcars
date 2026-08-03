// src/modules/lenders/lender/lender.routes.ts

import { Router } from 'express';
import { requireAuth } from '@/core/middleware/auth';
import { requirePermission } from '@/core/middleware/requirePermission';
import { imageUploader } from '@/core/middleware/upload.middleware';
import { asyncHandler } from '@/core/utils/asyncHandler';
import {
  getLenders,
  getLenderOptions,
  getLenderById,
  createLender,
  updateLender,
  updateLenderStatus,
  uploadLenderLogo,
  deleteLender,
} from './lender.controller';

const router = Router();

router.use(requireAuth(['admin']));

router.get('/', requirePermission('lenders.view'), asyncHandler(getLenders));
// Registered before /:id — otherwise Express would match "options" as
// the :id param (same convention as brand.routes.ts).
router.get('/options', requirePermission('lenders.view'), asyncHandler(getLenderOptions));
router.get('/:id', requirePermission('lenders.view'), asyncHandler(getLenderById));
router.post('/', requirePermission('lenders.create'), imageUploader('lenders').single('logo'), asyncHandler(createLender));
router.patch('/:id', requirePermission('lenders.update'), asyncHandler(updateLender));
router.patch('/:id/status', requirePermission('lenders.update'), asyncHandler(updateLenderStatus));
router.patch('/:id/logo', requirePermission('lenders.update'), imageUploader('lenders').single('logo'), asyncHandler(uploadLenderLogo));
router.delete('/:id', requirePermission('lenders.delete'), asyncHandler(deleteLender));

export default router;
