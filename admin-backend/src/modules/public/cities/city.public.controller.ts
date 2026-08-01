// src/modules/public/cities/city.public.controller.ts

import { Request, Response } from 'express';
import { sendSuccess } from '@/core/utils/sendResponse';
import { listPublicCityOptions } from './city.public.service';

// GET /cities/options
export async function getPublicCityOptions(_req: Request, res: Response) {
  const options = await listPublicCityOptions();
  return sendSuccess(res, options, 'City options fetched successfully');
}
