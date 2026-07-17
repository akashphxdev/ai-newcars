// src/modules/ads/adImpression/adImpression.controller.ts

import { Request, Response } from 'express';
import { ApiError } from '@/core/errors/ApiError';
import { sendSuccess, sendPaginated } from '@/core/utils/sendResponse';
import { getClientIp } from '@/core/utils/getClientIp';
import * as adImpressionService from './adImpression.service';
import {
  adImpressionListQuerySchema,
  adImpressionIdParamSchema,
  recordAdImpressionSchema,
} from './adImpression.validation';

export async function getAdImpressions(req: Request, res: Response) {
  const query = adImpressionListQuerySchema.parse(req.query);
  const result = await adImpressionService.listAdImpressions(query);
  return sendPaginated(res, result.items, result.pagination, 'Ad impressions fetched successfully');
}

// Public — no admin auth required. The live site calls this whenever a
// visitor actually sees an ad slot render. There's no public-user auth
// wired up yet, so userId always records as null for now.
export async function recordAdImpression(req: Request, res: Response) {
  const input = recordAdImpressionSchema.parse(req.body);
  const ipAddress = getClientIp(req);
  const result = await adImpressionService.recordAdImpression(input, null, ipAddress);
  return sendSuccess(res, result, 'Impression recorded', 201);
}

export async function deleteAdImpression(req: Request, res: Response) {
  const { id } = adImpressionIdParamSchema.parse(req.params);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const result = await adImpressionService.deleteAdImpression(id, req.auth.id);
  return sendSuccess(res, null, result.message);
}
