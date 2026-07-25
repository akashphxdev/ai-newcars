// src/modules/public/home/bodyType/bodyType.controller.ts

import { Request, Response } from 'express';
import { sendSuccess } from '@/core/utils/sendResponse';
import { homeBodyTypeListQuerySchema } from './bodyType.validation';
import * as bodyTypeService from './bodyType.service';

// GET /api/public/v1/home/body-types
export async function getHomeBodyTypes(req: Request, res: Response) {
  const query = homeBodyTypeListQuerySchema.parse(req.query);
  const bodyTypes = await bodyTypeService.listHomeBodyTypes(query);
  return sendSuccess(res, bodyTypes, 'Body types fetched successfully');
}
