// src/modules/public/articles/article/article.controller.ts

import { Request, Response } from 'express';
import { sendSuccess } from '@/core/utils/sendResponse';
import { articleDetailParamSchema, categorySlugParamSchema, relatedArticlesQuerySchema } from './article.validation';
import * as articleService from './article.service';

// GET /api/public/v1/articles/:categorySlug/:articleSlug
export async function getPublicArticle(req: Request, res: Response) {
  const { categorySlug, articleSlug } = articleDetailParamSchema.parse(req.params);
  const article = await articleService.getPublicArticleBySlug(categorySlug, articleSlug);
  return sendSuccess(res, article, 'Article fetched successfully');
}

// GET /api/public/v1/articles/:categorySlug — "More from this category"
export async function getRelatedArticles(req: Request, res: Response) {
  const { categorySlug } = categorySlugParamSchema.parse(req.params);
  const query = relatedArticlesQuerySchema.parse(req.query);
  const articles = await articleService.listRelatedArticles(categorySlug, query);
  return sendSuccess(res, articles, 'Related articles fetched successfully');
}
