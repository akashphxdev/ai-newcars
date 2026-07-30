// src/modules/newCars/variantFeature/variantFeature.controller.ts

import { Request, Response } from 'express';
import { ApiError } from '@/core/errors/ApiError';
import { sendSuccess, sendPaginated } from '@/core/utils/sendResponse';
import { getClientIp } from '@/core/utils/getClientIp';
import * as variantFeatureService from './variantFeature.service';
import {
  variantFeatureVariantIdParamSchema,
  listVariantsWithFeaturesQuerySchema,
  syncVariantFeaturesSchema,
} from './variantFeature.validation';

// GET /new-cars/variant-features — only variants with features assigned
export async function getVariantsWithFeatures(req: Request, res: Response) {
  const query = listVariantsWithFeaturesQuerySchema.parse(req.query);
  const result = await variantFeatureService.listVariantsWithFeatures(query);
  return sendPaginated(res, result.items, result.pagination, 'Variants with features fetched successfully');
}

// GET /new-cars/variant-features/catalog
export async function getFeatureCatalog(_req: Request, res: Response) {
  const catalog = await variantFeatureService.getFeatureCatalog();
  return sendSuccess(res, catalog, 'Feature catalog fetched successfully');
}

// GET /new-cars/variant-features/:variantId
export async function getVariantFeatures(req: Request, res: Response) {
  const { variantId } = variantFeatureVariantIdParamSchema.parse(req.params);
  const features = await variantFeatureService.getVariantFeatures(variantId);
  return sendSuccess(res, features, 'Variant features fetched successfully');
}

// PUT /new-cars/variant-features/:variantId
export async function syncVariantFeatures(req: Request, res: Response) {
  const { variantId } = variantFeatureVariantIdParamSchema.parse(req.params);
  const input = syncVariantFeaturesSchema.parse(req.body);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const result = await variantFeatureService.syncVariantFeatures(variantId, input, req.auth.id, getClientIp(req));
  return sendSuccess(res, null, result.message);
}
