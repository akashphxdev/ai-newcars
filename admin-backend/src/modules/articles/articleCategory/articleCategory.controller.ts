// src/modules/articles/articleCategory/articleCategory.controller.ts

import { Request, Response } from 'express';
import { ApiError } from '@/core/errors/ApiError';
import { sendSuccess, sendPaginated } from '@/core/utils/sendResponse';
import * as articleCategoryService from './articleCategory.service';
import {
  articleCategoryListQuerySchema,
  articleCategoryIdParamSchema,
  createArticleCategorySchema,
  updateArticleCategorySchema,
  updateArticleCategoryStatusSchema,
} from './articleCategory.validation';

export async function getArticleCategories(req: Request, res: Response) {
  const query = articleCategoryListQuerySchema.parse(req.query);
  const result = await articleCategoryService.listArticleCategories(query);
  return sendPaginated(res, result.items, result.pagination, 'Article categories fetched successfully');
}

export async function getArticleCategoryById(req: Request, res: Response) {
  const { id } = articleCategoryIdParamSchema.parse(req.params);
  const category = await articleCategoryService.getArticleCategoryById(id);
  return sendSuccess(res, category, 'Article category fetched successfully');
}

export async function createArticleCategory(req: Request, res: Response) {
  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const input = createArticleCategorySchema.parse(req.body);
  const category = await articleCategoryService.createArticleCategory(input, req.auth.id);
  return sendSuccess(res, category, 'Article category created successfully', 201);
}

export async function updateArticleCategory(req: Request, res: Response) {
  const { id } = articleCategoryIdParamSchema.parse(req.params);
  const input = updateArticleCategorySchema.parse(req.body);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const category = await articleCategoryService.updateArticleCategory(id, input, req.auth.id);
  return sendSuccess(res, category, 'Article category updated successfully');
}

// Dedicated quick-toggle route for the row-level Active/Inactive switch.
export async function updateArticleCategoryStatus(req: Request, res: Response) {
  const { id } = articleCategoryIdParamSchema.parse(req.params);
  const { isActive } = updateArticleCategoryStatusSchema.parse(req.body);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const category = await articleCategoryService.updateArticleCategoryStatus(id, isActive, req.auth.id);
  return sendSuccess(res, category, 'Article category status updated successfully');
}

export async function deleteArticleCategory(req: Request, res: Response) {
  const { id } = articleCategoryIdParamSchema.parse(req.params);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const result = await articleCategoryService.deleteArticleCategory(id, req.auth.id);
  return sendSuccess(res, null, result.message);
}