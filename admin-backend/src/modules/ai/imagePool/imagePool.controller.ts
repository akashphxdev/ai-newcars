// src/modules/ai/imagePool/imagePool.controller.ts

import { Request, Response } from 'express';
import { ApiError } from '@/core/errors/ApiError';
import { sendSuccess, sendPaginated } from '@/core/utils/sendResponse';
import { getClientIp } from '@/core/utils/getClientIp';
import * as imagePoolService from './imagePool.service';
import { imagePoolListQuerySchema, uploadImagePoolSchema, imagePoolIdParamSchema } from './imagePool.validation';

export async function getImagePool(req: Request, res: Response) {
  const query = imagePoolListQuerySchema.parse(req.query);
  const result = await imagePoolService.listImagePool(query);
  return sendPaginated(res, result.items, result.pagination, 'AI image pool fetched successfully');
}

export async function uploadImagePool(req: Request, res: Response) {
  const { featureKey } = uploadImagePoolSchema.parse(req.body);
  const files = (req.files as Express.Multer.File[] | undefined) ?? [];

  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const created = await imagePoolService.createImagePoolEntries(
    featureKey,
    files,
    req.auth.id,
    getClientIp(req),
  );
  return sendSuccess(res, created, `${created.length} image(s) uploaded successfully`, 201);
}

export async function deleteImagePool(req: Request, res: Response) {
  const { id } = imagePoolIdParamSchema.parse(req.params);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const result = await imagePoolService.deleteImagePoolEntry(id, req.auth.id, getClientIp(req));
  return sendSuccess(res, null, result.message);
}