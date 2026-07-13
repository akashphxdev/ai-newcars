// src/modules/articles/articleComment/articleComment.routes.ts

import { Router } from 'express';
import { requireAuth } from '@/core/middleware/auth';
import { requirePermission } from '@/core/middleware/requirePermission';
import { asyncHandler } from '@/core/utils/asyncHandler';
import {
  getArticleComments,
  getArticleCommentById,
  updateArticleCommentStatus,
  deleteArticleComment,
} from './articleComment.controller';

const router = Router();

// Every comment-moderation route requires a logged-in admin.
router.use(requireAuth(['admin']));

router.get('/', requirePermission('article-comments.view'), asyncHandler(getArticleComments));
router.get('/:id', requirePermission('article-comments.view'), asyncHandler(getArticleCommentById));
router.patch(
  '/:id/status',
  requirePermission('article-comments.moderate'),
  asyncHandler(updateArticleCommentStatus),
);
router.delete('/:id', requirePermission('article-comments.delete'), asyncHandler(deleteArticleComment));

export default router;