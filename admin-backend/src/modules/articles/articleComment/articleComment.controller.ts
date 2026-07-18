// src/modules/articles/articleComment/articleComment.controller.ts

import { Request, Response } from 'express';
import { ApiError } from '@/core/errors/ApiError';
import { sendSuccess, sendPaginated } from '@/core/utils/sendResponse';
import { getClientIp } from '@/core/utils/getClientIp';
import * as articleCommentService from './articleComment.service';
import {
  articleCommentListQuerySchema,
  articleCommentIdParamSchema,
  updateArticleCommentStatusSchema,
} from './articleComment.validation';

export async function getArticleComments(req: Request, res: Response) {
  const query = articleCommentListQuerySchema.parse(req.query);
  const result = await articleCommentService.listArticleComments(query);
  return sendPaginated(res, result.items, result.pagination, 'Comments fetched successfully');
}

export async function getArticleCommentById(req: Request, res: Response) {
  const { id } = articleCommentIdParamSchema.parse(req.params);
  const comment = await articleCommentService.getArticleCommentById(id);
  return sendSuccess(res, comment, 'Comment fetched successfully');
}

export async function updateArticleCommentStatus(req: Request, res: Response) {
  const { id } = articleCommentIdParamSchema.parse(req.params);
  const input = updateArticleCommentStatusSchema.parse(req.body);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const comment = await articleCommentService.updateArticleCommentStatus(id, input, req.auth.id, getClientIp(req));
  return sendSuccess(res, comment, 'Comment status updated successfully');
}

export async function deleteArticleComment(req: Request, res: Response) {
  const { id } = articleCommentIdParamSchema.parse(req.params);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const result = await articleCommentService.deleteArticleComment(id, req.auth.id, getClientIp(req));
  return sendSuccess(res, null, result.message);
}