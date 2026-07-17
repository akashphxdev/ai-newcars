// src/modules/ai/log/aiLog.controller.ts

import { Request, Response } from 'express';
import { sendPaginated } from '@/core/utils/sendResponse';
import * as aiLogService from './aiLog.service';
import { aiLogListQuerySchema } from './aiLog.validation';

// GET /ai/logs
export async function getAiLogs(req: Request, res: Response) {
  const query = aiLogListQuerySchema.parse(req.query);
  const result = await aiLogService.listAiLogs(query);
  return sendPaginated(res, result.items, result.pagination, 'AI logs fetched successfully');
}