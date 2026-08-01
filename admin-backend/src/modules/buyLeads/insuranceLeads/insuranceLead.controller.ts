// src/modules/buyLeads/insuranceLeads/insuranceLead.controller.ts

import { Request, Response } from 'express';
import { ApiError } from '@/core/errors/ApiError';
import { sendSuccess, sendPaginated } from '@/core/utils/sendResponse';
import { getClientIp } from '@/core/utils/getClientIp';
import * as insuranceLeadService from './insuranceLead.service';
import {
  insuranceLeadListQuerySchema,
  insuranceLeadIdParamSchema,
  updateInsuranceLeadStatusSchema,
  addInsuranceLeadActivitySchema,
} from './insuranceLead.validation';

// GET /leads/buy/insurance
export async function getInsuranceLeads(req: Request, res: Response) {
  const query = insuranceLeadListQuerySchema.parse(req.query);
  const result = await insuranceLeadService.listInsuranceLeads(query);
  return sendPaginated(res, result.items, result.pagination, 'Leads fetched successfully');
}

// GET /leads/buy/insurance/:id
export async function getInsuranceLeadById(req: Request, res: Response) {
  const { id } = insuranceLeadIdParamSchema.parse(req.params);
  const lead = await insuranceLeadService.getInsuranceLeadById(id);
  return sendSuccess(res, lead, 'Lead fetched successfully');
}

// PATCH /leads/buy/insurance/:id/status
export async function updateInsuranceLeadStatus(req: Request, res: Response) {
  const { id } = insuranceLeadIdParamSchema.parse(req.params);
  const input = updateInsuranceLeadStatusSchema.parse(req.body);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const lead = await insuranceLeadService.updateInsuranceLeadStatus(id, input, req.auth.id, getClientIp(req));
  return sendSuccess(res, lead, 'Lead status updated successfully');
}

// POST /leads/buy/insurance/:id/activity
export async function addInsuranceLeadActivity(req: Request, res: Response) {
  const { id } = insuranceLeadIdParamSchema.parse(req.params);
  const input = addInsuranceLeadActivitySchema.parse(req.body);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const activity = await insuranceLeadService.addInsuranceLeadActivity(id, input, req.auth.id);
  return sendSuccess(res, activity, 'Note added successfully', 201);
}
