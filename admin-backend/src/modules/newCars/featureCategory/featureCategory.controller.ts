// src/modules/newCars/featureCategory/featureCategory.controller.ts
import { Request, Response } from 'express';
import { ApiError } from '@/core/errors/ApiError';
import { sendSuccess, sendPaginated } from '@/core/utils/sendResponse';
import { getClientIp } from '@/core/utils/getClientIp';
import * as featureCategoryService from './featureCategory.service';
import {
  featureCategoryListQuerySchema,
  featureCategoryIdParamSchema,
  createFeatureCategorySchema,
  updateFeatureCategorySchema,
} from './featureCategory.validation';

export async function getFeatureCategories(req: Request, res: Response) {
  const query = featureCategoryListQuerySchema.parse(req.query);
  const result = await featureCategoryService.listFeatureCategories(query);
  return sendPaginated(res, result.items, result.pagination, 'Feature categories fetched successfully');
}

// GET /feature-categories/options — lightweight, unpaginated {id, name}
// list for dropdowns.
export async function getFeatureCategoryOptions(_req: Request, res: Response) {
  const options = await featureCategoryService.listFeatureCategoryOptions();
  return sendSuccess(res, options, 'Feature category options fetched successfully');
}

export async function getFeatureCategoryById(req: Request, res: Response) {
  const { id } = featureCategoryIdParamSchema.parse(req.params);
  const category = await featureCategoryService.getFeatureCategoryById(id);
  return sendSuccess(res, category, 'Feature category fetched successfully');
}

export async function createFeatureCategory(req: Request, res: Response) {
  const input = createFeatureCategorySchema.parse(req.body);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const category = await featureCategoryService.createFeatureCategory(input, req.auth.id, getClientIp(req));
  return sendSuccess(res, category, 'Feature category created successfully', 201);
}

export async function updateFeatureCategory(req: Request, res: Response) {
  const { id } = featureCategoryIdParamSchema.parse(req.params);
  const input = updateFeatureCategorySchema.parse(req.body);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const category = await featureCategoryService.updateFeatureCategory(id, input, req.auth.id, getClientIp(req));
  return sendSuccess(res, category, 'Feature category updated successfully');
}

export async function deleteFeatureCategory(req: Request, res: Response) {
  const { id } = featureCategoryIdParamSchema.parse(req.params);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const result = await featureCategoryService.deleteFeatureCategory(id, req.auth.id, getClientIp(req));
  return sendSuccess(res, null, result.message);
}
