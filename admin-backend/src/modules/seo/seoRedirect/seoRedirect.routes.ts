// src/modules/seo/seoRedirect/seoRedirect.routes.ts

import { Router } from 'express';
import { requireAuth } from '@/core/middleware/auth';
import { requirePermission } from '@/core/middleware/requirePermission';
import { asyncHandler } from '@/core/utils/asyncHandler';
import {
  getSeoRedirects,
  getSeoRedirectById,
  createSeoRedirect,
  updateSeoRedirect,
  updateSeoRedirectStatus,
  deleteSeoRedirect,
} from './seoRedirect.controller';

const router = Router();

// Every redirect-management route requires a logged-in admin.
router.use(requireAuth(['admin']));

router.get('/', requirePermission('seo-redirects.view'), asyncHandler(getSeoRedirects));
router.get('/:id', requirePermission('seo-redirects.view'), asyncHandler(getSeoRedirectById));
router.post('/', requirePermission('seo-redirects.create'), asyncHandler(createSeoRedirect));
router.patch('/:id', requirePermission('seo-redirects.update'), asyncHandler(updateSeoRedirect));
// Dedicated quick-toggle route for the row-level status switch (mirrors
// seoMeta.routes.ts's PATCH /:id/status pattern).
router.patch('/:id/status', requirePermission('seo-redirects.update'), asyncHandler(updateSeoRedirectStatus));
router.delete('/:id', requirePermission('seo-redirects.delete'), asyncHandler(deleteSeoRedirect));

export default router;
