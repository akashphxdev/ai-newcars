// src/modules/ai/aiArticle/aiArticle.controller.ts

import { Request, Response } from 'express';
import { ApiError } from '@/core/errors/ApiError';
import { sendSuccess, sendPaginated } from '@/core/utils/sendResponse';
import { getClientIp } from '@/core/utils/getClientIp';
import * as aiArticleService from './aiArticle.service';
import { aiArticleListQuerySchema, aiArticleIdParamSchema, updateAiArticleSchema } from './aiArticle.validation';

// GET /ai/articles
export async function getAiArticles(req: Request, res: Response) {
  const query = aiArticleListQuerySchema.parse(req.query);
  const result = await aiArticleService.listAiArticles(query);
  return sendPaginated(res, result.items, result.pagination, 'AI articles fetched successfully');
}

// GET /ai/articles/:id
export async function getAiArticleById(req: Request, res: Response) {
  const { id } = aiArticleIdParamSchema.parse(req.params);
  const article = await aiArticleService.getAiArticleById(id);
  return sendSuccess(res, article, 'AI article fetched successfully');
}

// PATCH /ai/articles/:id
export async function updateAiArticle(req: Request, res: Response) {
  const { id } = aiArticleIdParamSchema.parse(req.params);
  const input = updateAiArticleSchema.parse(req.body);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const article = await aiArticleService.updateAiArticle(id, input, req.auth.id, getClientIp(req));
  return sendSuccess(res, article, 'AI article updated successfully');
}

// PATCH /ai/articles/:id/approve
export async function approveAiArticle(req: Request, res: Response) {
  const { id } = aiArticleIdParamSchema.parse(req.params);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const article = await aiArticleService.approveAiArticle(id, req.auth.id, getClientIp(req));
  return sendSuccess(res, article, 'AI article approved successfully');
}

// PATCH /ai/articles/:id/reject
export async function rejectAiArticle(req: Request, res: Response) {
  const { id } = aiArticleIdParamSchema.parse(req.params);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const article = await aiArticleService.rejectAiArticle(id, req.auth.id, getClientIp(req));
  return sendSuccess(res, article, 'AI article rejected successfully');
}

// PATCH /ai/articles/:id/publish
export async function publishAiArticle(req: Request, res: Response) {
  const { id } = aiArticleIdParamSchema.parse(req.params);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const article = await aiArticleService.publishAiArticle(id, req.auth.id, getClientIp(req));
  return sendSuccess(res, article, 'AI article published successfully');
}

// DELETE /ai/articles/:id
export async function deleteAiArticle(req: Request, res: Response) {
  const { id } = aiArticleIdParamSchema.parse(req.params);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const result = await aiArticleService.deleteAiArticle(id, req.auth.id, getClientIp(req));
  return sendSuccess(res, null, result.message);
}
