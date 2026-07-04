// src/modules/newCars/color/color.controller.ts

import { Request, Response } from 'express';
import { ApiError } from '@/core/errors/ApiError';
import { sendSuccess, sendPaginated } from '@/core/utils/sendResponse';
import { buildPublicPath, deleteUploadedFile } from '@/core/utils/fileStorage.util';
import * as colorService from './color.service';
import { colorListQuerySchema, colorIdParamSchema, createColorSchema, updateColorSchema } from './color.validation';

// GET /colors
export async function getColors(req: Request, res: Response) {
  const query = colorListQuerySchema.parse(req.query);
  const result = await colorService.listColors(query);
  return sendPaginated(res, result.items, result.pagination, 'Colors fetched successfully');
}

// GET /colors/:id
export async function getColorById(req: Request, res: Response) {
  const { id } = colorIdParamSchema.parse(req.params);
  const color = await colorService.getColorById(id);
  return sendSuccess(res, color, 'Color fetched successfully');
}

// POST /colors
// Image is optional on create — many colors are represented by
// colorHex alone with no swatch photo.
export async function createColor(req: Request, res: Response) {
  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  try {
    const input = createColorSchema.parse(req.body);
    const color = await colorService.createColor(input, req.auth.id, req.file?.filename);
    return sendSuccess(res, color, 'Color created successfully', 201);
  } catch (err) {
    if (req.file) {
      await deleteUploadedFile(buildPublicPath('colors', req.file.filename));
    }
    throw err;
  }
}

// PATCH /colors/:id
export async function updateColor(req: Request, res: Response) {
  const { id } = colorIdParamSchema.parse(req.params);
  const input = updateColorSchema.parse(req.body);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const color = await colorService.updateColor(id, input, req.auth.id);
  return sendSuccess(res, color, 'Color updated successfully');
}

// PATCH /colors/:id/image
export async function uploadColorImage(req: Request, res: Response) {
  const { id } = colorIdParamSchema.parse(req.params);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }
  if (!req.file) {
    throw ApiError.badRequest('No image file received (expected field name "image")');
  }

  const color = await colorService.uploadColorImage(id, req.file.filename, req.auth.id);
  return sendSuccess(res, color, 'Color image updated successfully');
}

// DELETE /colors/:id
export async function deleteColor(req: Request, res: Response) {
  const { id } = colorIdParamSchema.parse(req.params);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const result = await colorService.deleteColor(id, req.auth.id);
  return sendSuccess(res, null, result.message);
}