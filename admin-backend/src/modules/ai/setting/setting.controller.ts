// src/modules/ai/setting/setting.controller.ts

import { Request, Response } from 'express';
import { ApiError } from '@/core/errors/ApiError';
import { sendSuccess } from '@/core/utils/sendResponse';
import * as settingService from './setting.service';
import { upsertAiSettingSchema, testAiConnectionSchema } from './setting.validation';

// GET /ai/settings
export async function getAiSettings(_req: Request, res: Response) {
  const settings = await settingService.getSettings();
  return sendSuccess(res, settings, 'AI settings fetched successfully');
}

// PUT /ai/settings
export async function upsertAiSettings(req: Request, res: Response) {
  const input = upsertAiSettingSchema.parse(req.body);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const settings = await settingService.upsertSettings(input, req.auth.id);
  return sendSuccess(res, settings, 'AI settings saved successfully');
}

// POST /ai/settings/test-connection
export async function testAiConnection(req: Request, res: Response) {
  const input = testAiConnectionSchema.parse(req.body);
  const result = await settingService.testConnection(input);
  return sendSuccess(res, result, result.message);
}