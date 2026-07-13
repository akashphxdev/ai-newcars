// src/modules/articles/article/article.routes.ts

import { Router } from 'express';
import { requireAuth } from '@/core/middleware/auth';
import { requirePermission } from '@/core/middleware/requirePermission';
import { imageUploader } from '@/core/middleware/upload.middleware';
import { asyncHandler } from '@/core/utils/asyncHandler';
import {
  getArticles,
  getArticleById,
  createArticle,
  updateArticle,
  updateArticleStatus,
  uploadArticleCoverImage,
  uploadArticleContentImage,
  deleteArticleContentImage,
  deleteArticle,
} from './article.controller';

const router = Router();

// Every article-management route requires a logged-in admin.
router.use(requireAuth(['admin']));

// Rich-text editor image endpoints — mounted before the generic /:id
// routes below so "upload-image" is never mistaken for an :id param.
router.post(
  '/upload-image',
  requirePermission('articles.create'),
  imageUploader('articles/content').single('image'),
  asyncHandler(uploadArticleContentImage),
);
router.delete('/upload-image', requirePermission('articles.update'), asyncHandler(deleteArticleContentImage));

router.get('/', requirePermission('articles.view'), asyncHandler(getArticles));
router.get('/:id', requirePermission('articles.view'), asyncHandler(getArticleById));

router.post(
  '/',
  requirePermission('articles.create'),
  imageUploader('articles').single('coverImage'),
  asyncHandler(createArticle),
);

router.patch(
  '/:id',
  requirePermission('articles.update'),
  imageUploader('articles').single('coverImage'),
  asyncHandler(updateArticle),
);

// Dedicated quick-toggle route for the row-level status switch (mirrors
// offer.routes.ts's PATCH /:id/status pattern).
router.patch('/:id/status', requirePermission('articles.update'), asyncHandler(updateArticleStatus));

router.patch(
  '/:id/cover-image',
  requirePermission('articles.update'),
  imageUploader('articles').single('coverImage'),
  asyncHandler(uploadArticleCoverImage),
);

router.delete('/:id', requirePermission('articles.delete'), asyncHandler(deleteArticle));

export default router;