// src/modules/public/home/banner/banner.controller.ts

import { Request, Response } from 'express';
import { sendSuccess } from '@/core/utils/sendResponse';
import { bannerIdParamSchema } from './banner.validation';
import * as bannerService from './banner.service';

// GET /api/public/v1/home/banners
export async function getBanners(_req: Request, res: Response) {
  const banners = await bannerService.listActiveBanners();
  return sendSuccess(res, banners, 'Banners fetched successfully');
}

// PATCH /api/public/v1/home/banners/:id/click
export async function recordBannerClick(req: Request, res: Response) {
  const { id } = bannerIdParamSchema.parse(req.params);
  const result = await bannerService.incrementBannerClickCount(id);
  return sendSuccess(res, result, 'Click recorded');
}
