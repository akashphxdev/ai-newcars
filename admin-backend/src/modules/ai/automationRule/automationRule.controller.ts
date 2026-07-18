// src/modules/ai/automationRule/automationRule.controller.ts

import { Request, Response } from 'express';
import { ApiError } from '@/core/errors/ApiError';
import { sendSuccess } from '@/core/utils/sendResponse';
import { getClientIp } from '@/core/utils/getClientIp';
import * as automationRuleService from './automationRule.service';
import {
  featureKeyParamSchema,
  upsertAutomationRuleSchema,
  toggleAutomationRuleSchema,
} from './automationRule.validation';

// GET /ai/automation-rules
export async function getAutomationRules(_req: Request, res: Response) {
  const rules = await automationRuleService.listAutomationRules();
  return sendSuccess(res, rules, 'AI automation rules fetched successfully');
}

// GET /ai/automation-rules/:featureKey
export async function getAutomationRuleByFeature(req: Request, res: Response) {
  const { featureKey } = featureKeyParamSchema.parse(req.params);
  const rule = await automationRuleService.getAutomationRuleByFeature(featureKey);
  return sendSuccess(res, rule, 'AI automation rule fetched successfully');
}

// PUT /ai/automation-rules/:featureKey
export async function upsertAutomationRule(req: Request, res: Response) {
  const { featureKey } = featureKeyParamSchema.parse(req.params);
  const input = upsertAutomationRuleSchema.parse(req.body);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const rule = await automationRuleService.upsertAutomationRule(featureKey, input, req.auth.id, getClientIp(req));
  return sendSuccess(res, rule, 'AI automation rule saved successfully');
}

// PATCH /ai/automation-rules/:featureKey/toggle
export async function toggleAutomationRule(req: Request, res: Response) {
  const { featureKey } = featureKeyParamSchema.parse(req.params);
  const { enabled } = toggleAutomationRuleSchema.parse(req.body);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const rule = await automationRuleService.toggleAutomationRule(featureKey, enabled, req.auth.id, getClientIp(req));
  return sendSuccess(res, rule, `AI automation ${enabled ? 'enabled' : 'disabled'} successfully`);
}
