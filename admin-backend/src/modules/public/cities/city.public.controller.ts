// src/modules/public/cities/city.public.controller.ts

import { Request, Response } from 'express';
import { sendSuccess } from '@/core/utils/sendResponse';
import { listPublicCityOptions } from './city.public.service';

// GET /cities/options?sellCarOnly=true
export async function getPublicCityOptions(req: Request, res: Response) {
  const sellCarOnly = req.query.sellCarOnly === 'true';
  const options = await listPublicCityOptions(sellCarOnly);
  return sendSuccess(res, options, 'City options fetched successfully');
}
