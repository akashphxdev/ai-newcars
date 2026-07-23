// src/modules/public/home/banner/banner.controller.ts

import { Request, Response } from 'express';
import { sendSuccess } from '@/core/utils/sendResponse';
import * as bannerService from './banner.service';

// GET /api/public/v1/home/banners
export async function getBanners(_req: Request, res: Response) {
  const banners = await bannerService.listActiveBanners();
  return sendSuccess(res, banners, 'Banners fetched successfully');
}
