// src/modules/ads/adPlacement/adPlacement.controller.ts

import { Request, Response } from 'express';
import { ApiError } from '@/core/errors/ApiError';
import { sendSuccess, sendPaginated } from '@/core/utils/sendResponse';
import * as adPlacementService from './adPlacement.service';
import {
  adPlacementListQuerySchema,
  adPlacementIdParamSchema,
  createAdPlacementSchema,
  updateAdPlacementSchema,
  updateAdPlacementStatusSchema,
} from './adPlacement.validation';

export async function getAdPlacements(req: Request, res: Response) {
  const query = adPlacementListQuerySchema.parse(req.query);
  const result = await adPlacementService.listAdPlacements(query);
  return sendPaginated(res, result.items, result.pagination, 'Ad placements fetched successfully');
}

export async function getAdPlacementById(req: Request, res: Response) {
  const { id } = adPlacementIdParamSchema.parse(req.params);
  const placement = await adPlacementService.getAdPlacementById(id);
  return sendSuccess(res, placement, 'Ad placement fetched successfully');
}

export async function createAdPlacement(req: Request, res: Response) {
  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const input = createAdPlacementSchema.parse(req.body);
  const placement = await adPlacementService.createAdPlacement(input, req.auth.id);
  return sendSuccess(res, placement, 'Ad placement created successfully', 201);
}

export async function updateAdPlacement(req: Request, res: Response) {
  const { id } = adPlacementIdParamSchema.parse(req.params);
  const input = updateAdPlacementSchema.parse(req.body);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const placement = await adPlacementService.updateAdPlacement(id, input, req.auth.id);
  return sendSuccess(res, placement, 'Ad placement updated successfully');
}

// Dedicated quick-toggle route for the row-level Active/Inactive switch.
export async function updateAdPlacementStatus(req: Request, res: Response) {
  const { id } = adPlacementIdParamSchema.parse(req.params);
  const { isActive } = updateAdPlacementStatusSchema.parse(req.body);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const placement = await adPlacementService.updateAdPlacementStatus(id, isActive, req.auth.id);
  return sendSuccess(res, placement, 'Ad placement status updated successfully');
}

export async function deleteAdPlacement(req: Request, res: Response) {
  const { id } = adPlacementIdParamSchema.parse(req.params);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const result = await adPlacementService.deleteAdPlacement(id, req.auth.id);
  return sendSuccess(res, null, result.message);
}