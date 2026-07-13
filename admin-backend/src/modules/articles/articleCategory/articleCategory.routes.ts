// src/modules/articles/articleCategory/articleCategory.routes.ts

import { Router } from 'express';
import { requireAuth } from '@/core/middleware/auth';
import { requirePermission } from '@/core/middleware/requirePermission';
import { asyncHandler } from '@/core/utils/asyncHandler';
import {
  getArticleCategories,
  getArticleCategoryById,
  createArticleCategory,
  updateArticleCategory,
  updateArticleCategoryStatus,
  deleteArticleCategory,
} from './articleCategory.controller';

const router = Router();

// Every article-category-management route requires a logged-in admin.
router.use(requireAuth(['admin']));

router.get('/', requirePermission('article-categories.view'), asyncHandler(getArticleCategories));
router.get('/:id', requirePermission('article-categories.view'), asyncHandler(getArticleCategoryById));
router.post('/', requirePermission('article-categories.create'), asyncHandler(createArticleCategory));
router.patch('/:id', requirePermission('article-categories.update'), asyncHandler(updateArticleCategory));
// Dedicated quick-toggle route for the row-level status switch (mirrors
// brand.routes.ts's PATCH /:id/status pattern).
router.patch('/:id/status', requirePermission('article-categories.update'), asyncHandler(updateArticleCategoryStatus));
router.delete('/:id', requirePermission('article-categories.delete'), asyncHandler(deleteArticleCategory));

export default router;