// src/modules/seo/seoRedirect/seoRedirect.controller.ts

import { Request, Response } from 'express';
import { ApiError } from '@/core/errors/ApiError';
import { sendSuccess, sendPaginated } from '@/core/utils/sendResponse';
import { getClientIp } from '@/core/utils/getClientIp';
import * as seoRedirectService from './seoRedirect.service';
import {
  seoRedirectListQuerySchema,
  seoRedirectIdParamSchema,
  createSeoRedirectSchema,
  updateSeoRedirectSchema,
  updateSeoRedirectStatusSchema,
} from './seoRedirect.validation';

export async function getSeoRedirects(req: Request, res: Response) {
  const query = seoRedirectListQuerySchema.parse(req.query);
  const result = await seoRedirectService.listSeoRedirects(query);
  return sendPaginated(res, result.items, result.pagination, 'Redirects fetched successfully');
}

export async function getSeoRedirectById(req: Request, res: Response) {
  const { id } = seoRedirectIdParamSchema.parse(req.params);
  const redirect = await seoRedirectService.getSeoRedirectById(id);
  return sendSuccess(res, redirect, 'Redirect fetched successfully');
}

export async function createSeoRedirect(req: Request, res: Response) {
  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const input = createSeoRedirectSchema.parse(req.body);
  const redirect = await seoRedirectService.createSeoRedirect(input, req.auth.id, getClientIp(req));
  return sendSuccess(res, redirect, 'Redirect created successfully', 201);
}

export async function updateSeoRedirect(req: Request, res: Response) {
  const { id } = seoRedirectIdParamSchema.parse(req.params);
  const input = updateSeoRedirectSchema.parse(req.body);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const redirect = await seoRedirectService.updateSeoRedirect(id, input, req.auth.id, getClientIp(req));
  return sendSuccess(res, redirect, 'Redirect updated successfully');
}

// Dedicated quick-toggle route for the row-level Active/Inactive switch.
export async function updateSeoRedirectStatus(req: Request, res: Response) {
  const { id } = seoRedirectIdParamSchema.parse(req.params);
  const { isActive } = updateSeoRedirectStatusSchema.parse(req.body);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const redirect = await seoRedirectService.updateSeoRedirectStatus(id, isActive, req.auth.id, getClientIp(req));
  return sendSuccess(res, redirect, 'Redirect status updated successfully');
}

export async function deleteSeoRedirect(req: Request, res: Response) {
  const { id } = seoRedirectIdParamSchema.parse(req.params);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const result = await seoRedirectService.deleteSeoRedirect(id, req.auth.id, getClientIp(req));
  return sendSuccess(res, null, result.message);
}
