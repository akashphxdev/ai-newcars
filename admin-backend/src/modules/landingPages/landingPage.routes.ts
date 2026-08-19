// src/modules/landingPages/landingPage.routes.ts
//
// Admin-only. Landing pages are served to the public by nginx straight
// from disk, so nothing here is on a visitor's path.

import { Router } from 'express';
import { requireAuth } from '@/core/middleware/auth';
import { requirePermission } from '@/core/middleware/requirePermission';
import { asyncHandler } from '@/core/utils/asyncHandler';
import { landingAssetUploader } from '@/core/middleware/upload.middleware';
import {
  getLandingPages,
  getLandingPage,
  getLandingFiles,
  saveLandingPage,
  uploadLandingAssets,
  deleteLandingFile,
  deleteLandingPage,
} from './landingPage.controller';

const router = Router();

router.use(requireAuth(['admin']));

router.get('/', requirePermission('landing-pages.view'), asyncHandler(getLandingPages));
router.get('/:slug', requirePermission('landing-pages.view'), asyncHandler(getLandingPage));
router.post('/', requirePermission('landing-pages.create'), asyncHandler(saveLandingPage));
router.post(
  '/:slug/assets',
  requirePermission('landing-pages.create'),
  landingAssetUploader,
  asyncHandler(uploadLandingAssets),
);
router.get('/:slug/files', requirePermission('landing-pages.view'), asyncHandler(getLandingFiles));
router.delete('/:slug/files', requirePermission('landing-pages.delete'), asyncHandler(deleteLandingFile));
router.delete('/:slug', requirePermission('landing-pages.delete'), asyncHandler(deleteLandingPage));

export default router;
