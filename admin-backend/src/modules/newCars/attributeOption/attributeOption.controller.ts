// src/modules/newCars/attributeOption/attributeOption.controller.ts

import { Request, Response } from 'express';
import { ApiError } from '@/core/errors/ApiError';
import { sendSuccess, sendPaginated } from '@/core/utils/sendResponse';
import * as attributeOptionService from './attributeOption.service';
import {
  attributeOptionListQuerySchema,
  attributeOptionIdParamSchema,
  createAttributeOptionSchema,
  updateAttributeOptionSchema,
} from './attributeOption.validation';

// GET /attribute-options
export async function getAttributeOptions(req: Request, res: Response) {
  const query = attributeOptionListQuerySchema.parse(req.query);
  const result = await attributeOptionService.listAttributeOptions(query);
  return sendPaginated(res, result.items, result.pagination, 'Attribute options fetched successfully');
}

// GET /attribute-options/grouped
// Returns every option bucketed by category, e.g.
// { transmission: [...], drivetrain: [...] } — one call to populate
// several dropdowns on the variant/powertrain forms at once.
export async function getAttributeOptionsGrouped(_req: Request, res: Response) {
  const result = await attributeOptionService.listAttributeOptionsGrouped();
  return sendSuccess(res, result, 'Attribute options fetched successfully');
}

// GET /attribute-options/:id
export async function getAttributeOptionById(req: Request, res: Response) {
  const { id } = attributeOptionIdParamSchema.parse(req.params);
  const option = await attributeOptionService.getAttributeOptionById(id);
  return sendSuccess(res, option, 'Attribute option fetched successfully');
}

// POST /attribute-options
export async function createAttributeOption(req: Request, res: Response) {
  const input = createAttributeOptionSchema.parse(req.body);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const option = await attributeOptionService.createAttributeOption(input, req.auth.id);
  return sendSuccess(res, option, 'Attribute option created successfully', 201);
}

// PATCH /attribute-options/:id
export async function updateAttributeOption(req: Request, res: Response) {
  const { id } = attributeOptionIdParamSchema.parse(req.params);
  const input = updateAttributeOptionSchema.parse(req.body);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const option = await attributeOptionService.updateAttributeOption(id, input, req.auth.id);
  return sendSuccess(res, option, 'Attribute option updated successfully');
}

// DELETE /attribute-options/:id
export async function deleteAttributeOption(req: Request, res: Response) {
  const { id } = attributeOptionIdParamSchema.parse(req.params);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const result = await attributeOptionService.deleteAttributeOption(id, req.auth.id);
  return sendSuccess(res, null, result.message);
}