// src/modules/ads/adCampaign/adCampaign.controller.ts

import { Request, Response } from 'express';
import { ApiError } from '@/core/errors/ApiError';
import { sendSuccess, sendPaginated } from '@/core/utils/sendResponse';
import { buildPublicPath, deleteUploadedFile } from '@/core/utils/fileStorage.util';
import * as adCampaignService from './adCampaign.service';
import {
  adCampaignListQuerySchema,
  adCampaignIdParamSchema,
  createAdCampaignSchema,
  updateAdCampaignSchema,
  updateAdCampaignStatusSchema,
} from './adCampaign.validation';

export async function getAdCampaigns(req: Request, res: Response) {
  const query = adCampaignListQuerySchema.parse(req.query);
  const result = await adCampaignService.listAdCampaigns(query);
  return sendPaginated(res, result.items, result.pagination, 'Ad campaigns fetched successfully');
}

export async function getAdCampaignById(req: Request, res: Response) {
  const { id } = adCampaignIdParamSchema.parse(req.params);
  const campaign = await adCampaignService.getAdCampaignById(id);
  return sendSuccess(res, campaign, 'Ad campaign fetched successfully');
}

export async function createAdCampaign(req: Request, res: Response) {
  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  if (!req.file) {
    throw ApiError.badRequest('A creative image is required (expected field name "creativeImage")');
  }

  try {
    const input = createAdCampaignSchema.parse(req.body);
    const campaign = await adCampaignService.createAdCampaign(input, req.auth.id, req.file.filename);
    return sendSuccess(res, campaign, 'Ad campaign created successfully', 201);
  } catch (err) {
    if (req.file) {
      await deleteUploadedFile(buildPublicPath('ad-campaigns', req.file.filename));
    }
    throw err;
  }
}

export async function updateAdCampaign(req: Request, res: Response) {
  const { id } = adCampaignIdParamSchema.parse(req.params);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  try {
    const input = updateAdCampaignSchema.parse(req.body);
    // Creative image (if any) rides along in the same call — saved in
    // the same operation as the rest of the fields, same atomic
    // convention as article.controller.ts's updateArticle.
    const campaign = await adCampaignService.updateAdCampaign(id, input, req.auth.id, req.file?.filename);
    return sendSuccess(res, campaign, 'Ad campaign updated successfully');
  } catch (err) {
    if (req.file) {
      await deleteUploadedFile(buildPublicPath('ad-campaigns', req.file.filename));
    }
    throw err;
  }
}

// Dedicated quick-toggle route for the row-level status switch.
export async function updateAdCampaignStatus(req: Request, res: Response) {
  const { id } = adCampaignIdParamSchema.parse(req.params);
  const { status } = updateAdCampaignStatusSchema.parse(req.body);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const campaign = await adCampaignService.updateAdCampaignStatus(id, status, req.auth.id);
  return sendSuccess(res, campaign, 'Ad campaign status updated successfully');
}

export async function deleteAdCampaign(req: Request, res: Response) {
  const { id } = adCampaignIdParamSchema.parse(req.params);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const result = await adCampaignService.deleteAdCampaign(id, req.auth.id);
  return sendSuccess(res, null, result.message);
}
