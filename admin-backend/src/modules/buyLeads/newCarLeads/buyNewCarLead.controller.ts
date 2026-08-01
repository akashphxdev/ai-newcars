// src/modules/buyLeads/newCarLeads/buyNewCarLead.controller.ts

import { Request, Response } from 'express';
import { ApiError } from '@/core/errors/ApiError';
import { sendSuccess, sendPaginated } from '@/core/utils/sendResponse';
import { getClientIp } from '@/core/utils/getClientIp';
import * as buyNewCarLeadService from './buyNewCarLead.service';
import {
  buyNewCarLeadListQuerySchema,
  buyNewCarLeadIdParamSchema,
  updateBuyNewCarLeadStatusSchema,
  addBuyNewCarLeadActivitySchema,
} from './buyNewCarLead.validation';

// GET /leads/buy/new-cars
export async function getBuyNewCarLeads(req: Request, res: Response) {
  const query = buyNewCarLeadListQuerySchema.parse(req.query);
  const result = await buyNewCarLeadService.listBuyNewCarLeads(query);
  return sendPaginated(res, result.items, result.pagination, 'Leads fetched successfully');
}

// GET /leads/buy/new-cars/stats
export async function getBuyNewCarLeadStats(_req: Request, res: Response) {
  const stats = await buyNewCarLeadService.getBuyNewCarLeadStats();
  return sendSuccess(res, stats, 'Lead stats fetched successfully');
}

// GET /leads/buy/new-cars/:id
export async function getBuyNewCarLeadById(req: Request, res: Response) {
  const { id } = buyNewCarLeadIdParamSchema.parse(req.params);
  const lead = await buyNewCarLeadService.getBuyNewCarLeadById(id);
  return sendSuccess(res, lead, 'Lead fetched successfully');
}

// PATCH /leads/buy/new-cars/:id/status
export async function updateBuyNewCarLeadStatus(req: Request, res: Response) {
  const { id } = buyNewCarLeadIdParamSchema.parse(req.params);
  const input = updateBuyNewCarLeadStatusSchema.parse(req.body);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const lead = await buyNewCarLeadService.updateBuyNewCarLeadStatus(id, input, req.auth.id, getClientIp(req));
  return sendSuccess(res, lead, 'Lead status updated successfully');
}

// POST /leads/buy/new-cars/:id/activity
export async function addBuyNewCarLeadActivity(req: Request, res: Response) {
  const { id } = buyNewCarLeadIdParamSchema.parse(req.params);
  const input = addBuyNewCarLeadActivitySchema.parse(req.body);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const activity = await buyNewCarLeadService.addBuyNewCarLeadActivity(id, input, req.auth.id);
  return sendSuccess(res, activity, 'Note added successfully', 201);
}
