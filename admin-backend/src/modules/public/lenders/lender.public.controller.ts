// src/modules/public/lenders/lender.public.controller.ts

import { Request, Response } from 'express';
import { sendSuccess } from '@/core/utils/sendResponse';
import { listPublicLenderOptions } from './lender.public.service';

// GET /lenders/options
export async function getPublicLenderOptions(_req: Request, res: Response) {
  const options = await listPublicLenderOptions();
  return sendSuccess(res, options, 'Lender options fetched successfully');
}
