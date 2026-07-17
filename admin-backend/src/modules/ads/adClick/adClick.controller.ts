// src/modules/ads/adClick/adClick.controller.ts

import { Request, Response } from 'express';
import { ApiError } from '@/core/errors/ApiError';
import { sendSuccess, sendPaginated } from '@/core/utils/sendResponse';
import { getClientIp } from '@/core/utils/getClientIp';
import * as adClickService from './adClick.service';
import { adClickListQuerySchema, adClickIdParamSchema, recordAdClickSchema } from './adClick.validation';

export async function getAdClicks(req: Request, res: Response) {
  const query = adClickListQuerySchema.parse(req.query);
  const result = await adClickService.listAdClicks(query);
  return sendPaginated(res, result.items, result.pagination, 'Ad clicks fetched successfully');
}

// Public — no admin auth required. The live site calls this whenever a
// visitor actually clicks an ad. There's no public-user auth wired up
// yet, so userId always records as null for now.
export async function recordAdClick(req: Request, res: Response) {
  const input = recordAdClickSchema.parse(req.body);
  const ipAddress = getClientIp(req);
  const result = await adClickService.recordAdClick(input, null, ipAddress);
  return sendSuccess(res, result, 'Click recorded', 201);
}

export async function deleteAdClick(req: Request, res: Response) {
  const { id } = adClickIdParamSchema.parse(req.params);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const result = await adClickService.deleteAdClick(id, req.auth.id);
  return sendSuccess(res, null, result.message);
}
