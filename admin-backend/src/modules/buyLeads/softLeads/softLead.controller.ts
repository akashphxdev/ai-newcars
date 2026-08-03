// src/modules/buyLeads/softLeads/softLead.controller.ts

import { Request, Response } from 'express';
import { ApiError } from '@/core/errors/ApiError';
import { sendSuccess, sendPaginated } from '@/core/utils/sendResponse';
import { getClientIp } from '@/core/utils/getClientIp';
import * as softLeadService from './softLead.service';
import {
  softLeadListQuerySchema,
  softLeadIdParamSchema,
  updateSoftLeadStatusSchema,
  addSoftLeadActivitySchema,
} from './softLead.validation';

// GET /leads/buy/soft
export async function getSoftLeads(req: Request, res: Response) {
  const query = softLeadListQuerySchema.parse(req.query);
  const result = await softLeadService.listSoftLeads(query);
  return sendPaginated(res, result.items, result.pagination, 'Leads fetched successfully');
}

// GET /leads/buy/soft/stats
export async function getSoftLeadStats(_req: Request, res: Response) {
  const stats = await softLeadService.getSoftLeadStats();
  return sendSuccess(res, stats, 'Lead stats fetched successfully');
}

// GET /leads/buy/soft/:id
export async function getSoftLeadById(req: Request, res: Response) {
  const { id } = softLeadIdParamSchema.parse(req.params);
  const lead = await softLeadService.getSoftLeadById(id);
  return sendSuccess(res, lead, 'Lead fetched successfully');
}

// PATCH /leads/buy/soft/:id/status
export async function updateSoftLeadStatus(req: Request, res: Response) {
  const { id } = softLeadIdParamSchema.parse(req.params);
  const input = updateSoftLeadStatusSchema.parse(req.body);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const lead = await softLeadService.updateSoftLeadStatus(id, input, req.auth.id, getClientIp(req));
  return sendSuccess(res, lead, 'Lead status updated successfully');
}

// POST /leads/buy/soft/:id/activity
export async function addSoftLeadActivity(req: Request, res: Response) {
  const { id } = softLeadIdParamSchema.parse(req.params);
  const input = addSoftLeadActivitySchema.parse(req.body);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const activity = await softLeadService.addSoftLeadActivity(id, input, req.auth.id);
  return sendSuccess(res, activity, 'Note added successfully', 201);
}
