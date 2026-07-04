// src/modules/newCars/variant/variant.controller.ts

import { Request, Response } from 'express';
import { ApiError } from '@/core/errors/ApiError';
import { sendSuccess, sendPaginated } from '@/core/utils/sendResponse';
import * as variantService from './variant.service';
import {
  variantListQuerySchema,
  variantIdParamSchema,
  createVariantSchema,
  updateVariantSchema,
} from './variant.validation';

// GET /variants
export async function getVariants(req: Request, res: Response) {
  const query = variantListQuerySchema.parse(req.query);
  const result = await variantService.listVariants(query);
  return sendPaginated(res, result.items, result.pagination, 'Variants fetched successfully');
}

// GET /variants/:id
export async function getVariantById(req: Request, res: Response) {
  const { id } = variantIdParamSchema.parse(req.params);
  const variant = await variantService.getVariantById(id);
  return sendSuccess(res, variant, 'Variant fetched successfully');
}

// POST /variants
export async function createVariant(req: Request, res: Response) {
  const input = createVariantSchema.parse(req.body);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const variant = await variantService.createVariant(input, req.auth.id);
  return sendSuccess(res, variant, 'Variant created successfully', 201);
}

// PATCH /variants/:id
// NOTE: unlike Brand/CarModel's partial update, updateVariantSchema
// requires every field — the frontend always submits the full form,
// on both Add and Edit.
export async function updateVariant(req: Request, res: Response) {
  const { id } = variantIdParamSchema.parse(req.params);
  const input = updateVariantSchema.parse(req.body);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const variant = await variantService.updateVariant(id, input, req.auth.id);
  return sendSuccess(res, variant, 'Variant updated successfully');
}

// DELETE /variants/:id
export async function deleteVariant(req: Request, res: Response) {
  const { id } = variantIdParamSchema.parse(req.params);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const result = await variantService.deleteVariant(id, req.auth.id);
  return sendSuccess(res, null, result.message);
}