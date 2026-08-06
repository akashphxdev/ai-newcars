// src/modules/seo/seoMeta/seoMeta.routes.ts

import { Router } from 'express';
import { requireAuth } from '@/core/middleware/auth';
import { requirePermission } from '@/core/middleware/requirePermission';
import { asyncHandler } from '@/core/utils/asyncHandler';
import {
  getSeoMetas,
  getSeoMetaById,
  createSeoMeta,
  updateSeoMeta,
  updateSeoMetaStatus,
  deleteSeoMeta,
} from './seoMeta.controller';

const router = Router();

// Every SEO-meta-management route requires a logged-in admin.
router.use(requireAuth(['admin']));

router.get('/', requirePermission('seo-meta.view'), asyncHandler(getSeoMetas));
router.get('/:id', requirePermission('seo-meta.view'), asyncHandler(getSeoMetaById));
router.post('/', requirePermission('seo-meta.create'), asyncHandler(createSeoMeta));
router.patch('/:id', requirePermission('seo-meta.update'), asyncHandler(updateSeoMeta));
// Dedicated quick-toggle route for the row-level status switch (mirrors
// adPlacement.routes.ts's PATCH /:id/status pattern).
router.patch('/:id/status', requirePermission('seo-meta.update'), asyncHandler(updateSeoMetaStatus));
router.delete('/:id', requirePermission('seo-meta.delete'), asyncHandler(deleteSeoMeta));

export default router;
