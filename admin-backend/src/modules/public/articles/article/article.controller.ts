// src/modules/public/articles/article/article.controller.ts

import { Request, Response } from 'express';
import { sendSuccess, sendPaginated } from '@/core/utils/sendResponse';
import { articleDetailParamSchema, categorySlugParamSchema, relatedArticlesQuerySchema } from './article.validation';
import * as articleService from './article.service';

// GET /api/public/v1/articles/categories
export async function getArticleCategories(_req: Request, res: Response) {
  const categories = await articleService.listArticleCategories();
  return sendSuccess(res, categories, 'Article categories fetched successfully');
}

// GET /api/public/v1/articles/:categorySlug/:articleSlug
export async function getPublicArticle(req: Request, res: Response) {
  const { categorySlug, articleSlug } = articleDetailParamSchema.parse(req.params);
  const article = await articleService.getPublicArticleBySlug(categorySlug, articleSlug);
  return sendSuccess(res, article, 'Article fetched successfully');
}

// GET /api/public/v1/articles/:categorySlug — "More from this category"
// widget (small fixed limit) and the /news/[categorySlug] listing page's
// "Load more" pagination (page increments) share this one route.
export async function getRelatedArticles(req: Request, res: Response) {
  const { categorySlug } = categorySlugParamSchema.parse(req.params);
  const query = relatedArticlesQuerySchema.parse(req.query);
  const { items, pagination } = await articleService.listRelatedArticles(categorySlug, query);
  return sendPaginated(res, items, pagination, 'Related articles fetched successfully');
}
