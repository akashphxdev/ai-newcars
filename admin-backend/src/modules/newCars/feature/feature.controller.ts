// src/modules/newCars/feature/feature.controller.ts

import { Request, Response } from 'express';
import { ApiError } from '@/core/errors/ApiError';
import { sendSuccess, sendPaginated } from '@/core/utils/sendResponse';
import * as featureService from './feature.service';
import {
  featureListQuerySchema,
  featureIdParamSchema,
  createFeatureSchema,
  updateFeatureSchema,
} from './feature.validation';

// GET /new-cars/features
export async function getFeatures(req: Request, res: Response) {
  const query = featureListQuerySchema.parse(req.query);
  const result = await featureService.listFeatures(query);
  return sendPaginated(res, result.items, result.pagination, 'Feature sheets fetched successfully');
}

// GET /new-cars/features/:id
export async function getFeatureById(req: Request, res: Response) {
  const { id } = featureIdParamSchema.parse(req.params);
  const feature = await featureService.getFeatureById(id);
  return sendSuccess(res, feature, 'Feature sheet fetched successfully');
}

// POST /new-cars/features
export async function createFeature(req: Request, res: Response) {
  const input = createFeatureSchema.parse(req.body);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const feature = await featureService.createFeature(input, req.auth.id);
  return sendSuccess(res, feature, 'Feature sheet created successfully', 201);
}

// PATCH /new-cars/features/:id
export async function updateFeature(req: Request, res: Response) {
  const { id } = featureIdParamSchema.parse(req.params);
  const input = updateFeatureSchema.parse(req.body);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const feature = await featureService.updateFeature(id, input, req.auth.id);
  return sendSuccess(res, feature, 'Feature sheet updated successfully');
}

// DELETE /new-cars/features/:id
export async function deleteFeature(req: Request, res: Response) {
  const { id } = featureIdParamSchema.parse(req.params);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const result = await featureService.deleteFeature(id, req.auth.id);
  return sendSuccess(res, null, result.message);
}