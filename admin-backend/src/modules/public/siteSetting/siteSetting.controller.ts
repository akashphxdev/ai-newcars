// src/modules/public/siteSetting/siteSetting.controller.ts

import { Request, Response } from 'express';
import { sendSuccess } from '@/core/utils/sendResponse';
import * as siteSettingService from './siteSetting.service';

// GET /api/public/v1/site-settings
export async function getPublicSiteSettings(_req: Request, res: Response) {
  const settings = await siteSettingService.getPublicSiteSettings();
  return sendSuccess(res, settings, 'Site settings fetched successfully');
}
