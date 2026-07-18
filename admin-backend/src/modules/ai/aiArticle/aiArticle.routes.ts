// src/modules/ai/aiArticle/aiArticle.routes.ts

import { Router } from 'express';
import { requireAuth } from '@/core/middleware/auth';
import { requirePermission } from '@/core/middleware/requirePermission';
import { asyncHandler } from '@/core/utils/asyncHandler';
import {
  getAiArticles,
  getAiArticleById,
  updateAiArticle,
  approveAiArticle,
  rejectAiArticle,
  publishAiArticle,
  deleteAiArticle,
} from './aiArticle.controller';

const router = Router();

router.use(requireAuth(['admin']));

router.get('/', requirePermission('ai.articles.view'), asyncHandler(getAiArticles));
router.get('/:id', requirePermission('ai.articles.view'), asyncHandler(getAiArticleById));
router.patch('/:id', requirePermission('ai.articles.update'), asyncHandler(updateAiArticle));
router.patch('/:id/approve', requirePermission('ai.articles.update'), asyncHandler(approveAiArticle));
router.patch('/:id/reject', requirePermission('ai.articles.update'), asyncHandler(rejectAiArticle));
router.patch('/:id/publish', requirePermission('ai.articles.update'), asyncHandler(publishAiArticle));
router.delete('/:id', requirePermission('ai.articles.delete'), asyncHandler(deleteAiArticle));

export default router;
