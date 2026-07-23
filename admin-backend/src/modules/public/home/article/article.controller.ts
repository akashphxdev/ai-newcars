// src/modules/public/home/article/article.controller.ts

import { Request, Response } from 'express';
import { sendSuccess } from '@/core/utils/sendResponse';
import { homeArticleListQuerySchema } from './article.validation';
import * as articleService from './article.service';

// GET /api/public/v1/home/articles
export async function getHomeArticles(req: Request, res: Response) {
  const query = homeArticleListQuerySchema.parse(req.query);
  const articles = await articleService.listHomeArticles(query);
  return sendSuccess(res, articles, 'Articles fetched successfully');
}
