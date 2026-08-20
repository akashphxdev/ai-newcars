// src/modules/sellLeads/scrapLeads/scrapLead.controller.ts

import { Request, Response } from 'express';
import { ApiError } from '@/core/errors/ApiError';
import { sendSuccess, sendPaginated } from '@/core/utils/sendResponse';
import { getClientIp } from '@/core/utils/getClientIp';
import * as scrapLeadService from './scrapLead.service';
import {
  scrapLeadListQuerySchema,
  scrapLeadIdParamSchema,
  updateScrapLeadStatusSchema,
  updateScrapLeadQuoteSchema,
  addScrapLeadActivitySchema,
} from './scrapLead.validation';

// GET /leads/sell/scrap
export async function getScrapLeads(req: Request, res: Response) {
  const query = scrapLeadListQuerySchema.parse(req.query);
  const result = await scrapLeadService.listScrapLeads(query);
  return sendPaginated(res, result.items, result.pagination, 'Leads fetched successfully');
}

// GET /leads/sell/scrap/:id
export async function getScrapLeadById(req: Request, res: Response) {
  const { id } = scrapLeadIdParamSchema.parse(req.params);
  const lead = await scrapLeadService.getScrapLeadById(id);
  return sendSuccess(res, lead, 'Lead fetched successfully');
}

// PATCH /leads/sell/scrap/:id/status
export async function updateScrapLeadStatus(req: Request, res: Response) {
  const { id } = scrapLeadIdParamSchema.parse(req.params);
  const input = updateScrapLeadStatusSchema.parse(req.body);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const lead = await scrapLeadService.updateScrapLeadStatus(id, input, req.auth.id, getClientIp(req));
  return sendSuccess(res, lead, 'Lead status updated successfully');
}

// PATCH /leads/sell/scrap/:id/quote
export async function updateScrapLeadQuote(req: Request, res: Response) {
  const { id } = scrapLeadIdParamSchema.parse(req.params);
  const input = updateScrapLeadQuoteSchema.parse(req.body);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const lead = await scrapLeadService.updateScrapLeadQuote(id, input, req.auth.id, getClientIp(req));
  return sendSuccess(res, lead, 'Quote recorded successfully');
}

// POST /leads/sell/scrap/:id/activity
export async function addScrapLeadActivity(req: Request, res: Response) {
  const { id } = scrapLeadIdParamSchema.parse(req.params);
  const input = addScrapLeadActivitySchema.parse(req.body);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const activity = await scrapLeadService.addScrapLeadActivity(id, input, req.auth.id);
  return sendSuccess(res, activity, 'Note added successfully', 201);
}
