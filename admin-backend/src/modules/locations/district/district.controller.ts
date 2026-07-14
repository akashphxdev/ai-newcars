// src/modules/locations/district/district.controller.ts

import { Request, Response } from 'express';
import { ApiError } from '@/core/errors/ApiError';
import { sendSuccess, sendPaginated } from '@/core/utils/sendResponse';
import * as districtService from './district.service';
import {
  districtListQuerySchema,
  districtOptionsQuerySchema,
  districtIdParamSchema,
  createDistrictSchema,
  updateDistrictSchema,
} from './district.validation';

// GET /districts
export async function getDistricts(req: Request, res: Response) {
  const query = districtListQuerySchema.parse(req.query);
  const result = await districtService.listDistricts(query);
  return sendPaginated(res, result.items, result.pagination, 'Districts fetched successfully');
}

// GET /districts/options — lightweight, unpaginated {id, name,
// stateId} list for dropdowns, optionally filtered by stateId.
export async function getDistrictOptions(req: Request, res: Response) {
  const query = districtOptionsQuerySchema.parse(req.query);
  const options = await districtService.listDistrictOptions(query);
  return sendSuccess(res, options, 'District options fetched successfully');
}

// GET /districts/:id
export async function getDistrictById(req: Request, res: Response) {
  const { id } = districtIdParamSchema.parse(req.params);
  const district = await districtService.getDistrictById(id);
  return sendSuccess(res, district, 'District fetched successfully');
}

// POST /districts
export async function createDistrict(req: Request, res: Response) {
  const input = createDistrictSchema.parse(req.body);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const district = await districtService.createDistrict(input, req.auth.id);
  return sendSuccess(res, district, 'District created successfully', 201);
}

// PATCH /districts/:id
export async function updateDistrict(req: Request, res: Response) {
  const { id } = districtIdParamSchema.parse(req.params);
  const input = updateDistrictSchema.parse(req.body);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const district = await districtService.updateDistrict(id, input, req.auth.id);
  return sendSuccess(res, district, 'District updated successfully');
}

// DELETE /districts/:id
export async function deleteDistrict(req: Request, res: Response) {
  const { id } = districtIdParamSchema.parse(req.params);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const result = await districtService.deleteDistrict(id, req.auth.id);
  return sendSuccess(res, null, result.message);
}