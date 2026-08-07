// src/modules/buyLeads/launchNotify/launchNotifyLead.controller.ts

import { Request, Response } from 'express';
import { ApiError } from '@/core/errors/ApiError';
import { sendSuccess, sendPaginated } from '@/core/utils/sendResponse';
import { getClientIp } from '@/core/utils/getClientIp';
import * as launchNotifyLeadService from './launchNotifyLead.service';
import {
  launchNotifyLeadListQuerySchema,
  launchNotifyLeadIdParamSchema,
  updateLaunchNotifyLeadActiveSchema,
  addLaunchNotifyLeadActivitySchema,
} from './launchNotifyLead.validation';

// GET /leads/buy/launch-notify
export async function getLaunchNotifyLeads(req: Request, res: Response) {
  const query = launchNotifyLeadListQuerySchema.parse(req.query);
  const result = await launchNotifyLeadService.listLaunchNotifyLeads(query);
  return sendPaginated(res, result.items, result.pagination, 'Leads fetched successfully');
}

// GET /leads/buy/launch-notify/stats
export async function getLaunchNotifyLeadStats(_req: Request, res: Response) {
  const stats = await launchNotifyLeadService.getLaunchNotifyLeadStats();
  return sendSuccess(res, stats, 'Lead stats fetched successfully');
}

// GET /leads/buy/launch-notify/:id
export async function getLaunchNotifyLeadById(req: Request, res: Response) {
  const { id } = launchNotifyLeadIdParamSchema.parse(req.params);
  const lead = await launchNotifyLeadService.getLaunchNotifyLeadById(id);
  return sendSuccess(res, lead, 'Lead fetched successfully');
}

// PATCH /leads/buy/launch-notify/:id/active
export async function updateLaunchNotifyLeadActive(req: Request, res: Response) {
  const { id } = launchNotifyLeadIdParamSchema.parse(req.params);
  const input = updateLaunchNotifyLeadActiveSchema.parse(req.body);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const lead = await launchNotifyLeadService.updateLaunchNotifyLeadActive(id, input, req.auth.id, getClientIp(req));
  return sendSuccess(res, lead, 'Lead updated successfully');
}

// POST /leads/buy/launch-notify/:id/activity
export async function addLaunchNotifyLeadActivity(req: Request, res: Response) {
  const { id } = launchNotifyLeadIdParamSchema.parse(req.params);
  const input = addLaunchNotifyLeadActivitySchema.parse(req.body);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const activity = await launchNotifyLeadService.addLaunchNotifyLeadActivity(id, input, req.auth.id);
  return sendSuccess(res, activity, 'Note added successfully', 201);
}
