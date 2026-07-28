// src/modules/analytics/searchLog/searchLog.controller.ts

import { Request, Response } from 'express';
import { ApiError } from '@/core/errors/ApiError';
import { sendSuccess, sendPaginated } from '@/core/utils/sendResponse';
import * as searchLogService from './searchLog.service';
import { searchLogListQuerySchema, searchLogIdParamSchema } from './searchLog.validation';

// GET /search-logs
export async function getSearchLogs(req: Request, res: Response) {
  const query = searchLogListQuerySchema.parse(req.query);
  const result = await searchLogService.listSearchLogs(query);
  return sendPaginated(res, result.items, result.pagination, 'Search logs fetched successfully');
}

// DELETE /search-logs/:id
export async function deleteSearchLog(req: Request, res: Response) {
  const { id } = searchLogIdParamSchema.parse(req.params);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const result = await searchLogService.deleteSearchLog(id, req.auth.id);
  return sendSuccess(res, null, result.message);
}
