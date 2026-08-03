// src/modules/buyLeads/loanLeads/loanLead.controller.ts

import { Request, Response } from 'express';
import { ApiError } from '@/core/errors/ApiError';
import { sendSuccess, sendPaginated } from '@/core/utils/sendResponse';
import { getClientIp } from '@/core/utils/getClientIp';
import * as loanLeadService from './loanLead.service';
import {
  loanLeadListQuerySchema,
  loanLeadIdParamSchema,
  updateLoanLeadStatusSchema,
  addLoanLeadActivitySchema,
} from './loanLead.validation';

// GET /leads/buy/loan
export async function getLoanLeads(req: Request, res: Response) {
  const query = loanLeadListQuerySchema.parse(req.query);
  const result = await loanLeadService.listLoanLeads(query);
  return sendPaginated(res, result.items, result.pagination, 'Leads fetched successfully');
}

// GET /leads/buy/loan/stats
export async function getLoanLeadStats(_req: Request, res: Response) {
  const stats = await loanLeadService.getLoanLeadStats();
  return sendSuccess(res, stats, 'Lead stats fetched successfully');
}

// GET /leads/buy/loan/:id
export async function getLoanLeadById(req: Request, res: Response) {
  const { id } = loanLeadIdParamSchema.parse(req.params);
  const lead = await loanLeadService.getLoanLeadById(id);
  return sendSuccess(res, lead, 'Lead fetched successfully');
}

// PATCH /leads/buy/loan/:id/status
export async function updateLoanLeadStatus(req: Request, res: Response) {
  const { id } = loanLeadIdParamSchema.parse(req.params);
  const input = updateLoanLeadStatusSchema.parse(req.body);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const lead = await loanLeadService.updateLoanLeadStatus(id, input, req.auth.id, getClientIp(req));
  return sendSuccess(res, lead, 'Lead status updated successfully');
}

// POST /leads/buy/loan/:id/activity
export async function addLoanLeadActivity(req: Request, res: Response) {
  const { id } = loanLeadIdParamSchema.parse(req.params);
  const input = addLoanLeadActivitySchema.parse(req.body);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const activity = await loanLeadService.addLoanLeadActivity(id, input, req.auth.id);
  return sendSuccess(res, activity, 'Note added successfully', 201);
}
