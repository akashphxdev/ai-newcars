// src/modules/siteSetting/siteSetting.controller.ts

import { Request, Response } from 'express';
import { ApiError } from '@/core/errors/ApiError';
import { sendSuccess } from '@/core/utils/sendResponse';
import { getClientIp } from '@/core/utils/getClientIp';
import * as siteSettingService from './siteSetting.service';
import { upsertSiteSettingSchema } from './siteSetting.validation';

// GET /site-settings
export async function getSiteSettings(_req: Request, res: Response) {
  const settings = await siteSettingService.getSettings();
  return sendSuccess(res, settings, 'Site settings fetched successfully');
}

// PUT /site-settings
export async function upsertSiteSettings(req: Request, res: Response) {
  const input = upsertSiteSettingSchema.parse(req.body);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const settings = await siteSettingService.upsertSettings(input, req.auth.id, getClientIp(req));
  return sendSuccess(res, settings, 'Site settings saved successfully');
}