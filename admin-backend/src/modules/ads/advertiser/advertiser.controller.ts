// src/modules/ads/advertiser/advertiser.controller.ts

import { Request, Response } from 'express';
import { ApiError } from '@/core/errors/ApiError';
import { sendSuccess, sendPaginated } from '@/core/utils/sendResponse';
import { getClientIp } from '@/core/utils/getClientIp';
import * as advertiserService from './advertiser.service';
import {
  advertiserListQuerySchema,
  advertiserIdParamSchema,
  createAdvertiserSchema,
  updateAdvertiserSchema,
  updateAdvertiserStatusSchema,
} from './advertiser.validation';

export async function getAdvertisers(req: Request, res: Response) {
  const query = advertiserListQuerySchema.parse(req.query);
  const result = await advertiserService.listAdvertisers(query);
  return sendPaginated(res, result.items, result.pagination, 'Advertisers fetched successfully');
}

export async function getAdvertiserById(req: Request, res: Response) {
  const { id } = advertiserIdParamSchema.parse(req.params);
  const advertiser = await advertiserService.getAdvertiserById(id);
  return sendSuccess(res, advertiser, 'Advertiser fetched successfully');
}

export async function createAdvertiser(req: Request, res: Response) {
  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const input = createAdvertiserSchema.parse(req.body);
  const advertiser = await advertiserService.createAdvertiser(input, req.auth.id, getClientIp(req));
  return sendSuccess(res, advertiser, 'Advertiser created successfully', 201);
}

export async function updateAdvertiser(req: Request, res: Response) {
  const { id } = advertiserIdParamSchema.parse(req.params);
  const input = updateAdvertiserSchema.parse(req.body);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const advertiser = await advertiserService.updateAdvertiser(id, input, req.auth.id, getClientIp(req));
  return sendSuccess(res, advertiser, 'Advertiser updated successfully');
}

// Dedicated quick-toggle route for the row-level Active/Inactive switch —
// same convention as adPlacement.controller.ts's updateAdPlacementStatus.
export async function updateAdvertiserStatus(req: Request, res: Response) {
  const { id } = advertiserIdParamSchema.parse(req.params);
  const { isActive } = updateAdvertiserStatusSchema.parse(req.body);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const advertiser = await advertiserService.updateAdvertiserStatus(id, isActive, req.auth.id, getClientIp(req));
  return sendSuccess(res, advertiser, 'Advertiser status updated successfully');
}

export async function deleteAdvertiser(req: Request, res: Response) {
  const { id } = advertiserIdParamSchema.parse(req.params);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const result = await advertiserService.deleteAdvertiser(id, req.auth.id, getClientIp(req));
  return sendSuccess(res, null, result.message);
}