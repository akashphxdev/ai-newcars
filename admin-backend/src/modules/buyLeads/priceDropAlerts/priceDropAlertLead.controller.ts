// src/modules/buyLeads/priceDropAlerts/priceDropAlertLead.controller.ts

import { Request, Response } from 'express';
import { ApiError } from '@/core/errors/ApiError';
import { sendSuccess, sendPaginated } from '@/core/utils/sendResponse';
import { getClientIp } from '@/core/utils/getClientIp';
import * as priceDropAlertLeadService from './priceDropAlertLead.service';
import {
  priceDropAlertLeadListQuerySchema,
  priceDropAlertLeadIdParamSchema,
  updatePriceDropAlertLeadActiveSchema,
  addPriceDropAlertLeadActivitySchema,
} from './priceDropAlertLead.validation';

// GET /leads/buy/price-drop
export async function getPriceDropAlertLeads(req: Request, res: Response) {
  const query = priceDropAlertLeadListQuerySchema.parse(req.query);
  const result = await priceDropAlertLeadService.listPriceDropAlertLeads(query);
  return sendPaginated(res, result.items, result.pagination, 'Leads fetched successfully');
}

// GET /leads/buy/price-drop/stats
export async function getPriceDropAlertLeadStats(_req: Request, res: Response) {
  const stats = await priceDropAlertLeadService.getPriceDropAlertLeadStats();
  return sendSuccess(res, stats, 'Lead stats fetched successfully');
}

// GET /leads/buy/price-drop/:id
export async function getPriceDropAlertLeadById(req: Request, res: Response) {
  const { id } = priceDropAlertLeadIdParamSchema.parse(req.params);
  const lead = await priceDropAlertLeadService.getPriceDropAlertLeadById(id);
  return sendSuccess(res, lead, 'Lead fetched successfully');
}

// PATCH /leads/buy/price-drop/:id/active
export async function updatePriceDropAlertLeadActive(req: Request, res: Response) {
  const { id } = priceDropAlertLeadIdParamSchema.parse(req.params);
  const input = updatePriceDropAlertLeadActiveSchema.parse(req.body);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const lead = await priceDropAlertLeadService.updatePriceDropAlertLeadActive(id, input, req.auth.id, getClientIp(req));
  return sendSuccess(res, lead, 'Lead updated successfully');
}

// POST /leads/buy/price-drop/:id/activity
export async function addPriceDropAlertLeadActivity(req: Request, res: Response) {
  const { id } = priceDropAlertLeadIdParamSchema.parse(req.params);
  const input = addPriceDropAlertLeadActivitySchema.parse(req.body);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const activity = await priceDropAlertLeadService.addPriceDropAlertLeadActivity(id, input, req.auth.id);
  return sendSuccess(res, activity, 'Note added successfully', 201);
}
