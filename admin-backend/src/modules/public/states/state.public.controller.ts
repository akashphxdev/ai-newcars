// src/modules/public/states/state.public.controller.ts

import { Request, Response } from 'express';
import { sendSuccess } from '@/core/utils/sendResponse';
import { listPublicStateOptions } from './state.public.service';

// GET /states/options
export async function getPublicStateOptions(_req: Request, res: Response) {
  const options = await listPublicStateOptions();
  return sendSuccess(res, options, 'State options fetched successfully');
}
