// src/modules/seo/seoMeta/seoMeta.controller.ts

import { Request, Response } from 'express';
import { ApiError } from '@/core/errors/ApiError';
import { sendSuccess, sendPaginated } from '@/core/utils/sendResponse';
import { getClientIp } from '@/core/utils/getClientIp';
import * as seoMetaService from './seoMeta.service';
import {
  seoMetaListQuerySchema,
  seoMetaIdParamSchema,
  createSeoMetaSchema,
  updateSeoMetaSchema,
  updateSeoMetaStatusSchema,
} from './seoMeta.validation';

export async function getSeoMetas(req: Request, res: Response) {
  const query = seoMetaListQuerySchema.parse(req.query);
  const result = await seoMetaService.listSeoMetas(query);
  return sendPaginated(res, result.items, result.pagination, 'SEO meta fetched successfully');
}

export async function getSeoMetaById(req: Request, res: Response) {
  const { id } = seoMetaIdParamSchema.parse(req.params);
  const seoMeta = await seoMetaService.getSeoMetaById(id);
  return sendSuccess(res, seoMeta, 'SEO meta fetched successfully');
}

export async function createSeoMeta(req: Request, res: Response) {
  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const input = createSeoMetaSchema.parse(req.body);
  const seoMeta = await seoMetaService.createSeoMeta(input, req.auth.id, getClientIp(req));
  return sendSuccess(res, seoMeta, 'SEO meta created successfully', 201);
}

export async function updateSeoMeta(req: Request, res: Response) {
  const { id } = seoMetaIdParamSchema.parse(req.params);
  const input = updateSeoMetaSchema.parse(req.body);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const seoMeta = await seoMetaService.updateSeoMeta(id, input, req.auth.id, getClientIp(req));
  return sendSuccess(res, seoMeta, 'SEO meta updated successfully');
}

// Dedicated quick-toggle route for the row-level Active/Inactive switch.
export async function updateSeoMetaStatus(req: Request, res: Response) {
  const { id } = seoMetaIdParamSchema.parse(req.params);
  const { status } = updateSeoMetaStatusSchema.parse(req.body);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const seoMeta = await seoMetaService.updateSeoMetaStatus(id, status, req.auth.id, getClientIp(req));
  return sendSuccess(res, seoMeta, 'SEO meta status updated successfully');
}

export async function deleteSeoMeta(req: Request, res: Response) {
  const { id } = seoMetaIdParamSchema.parse(req.params);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const result = await seoMetaService.deleteSeoMeta(id, req.auth.id, getClientIp(req));
  return sendSuccess(res, null, result.message);
}
