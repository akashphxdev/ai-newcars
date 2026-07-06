// src/modules/newCars/image/image.controller.ts

import { Request, Response } from 'express';
import { ApiError } from '@/core/errors/ApiError';
import { sendSuccess, sendPaginated } from '@/core/utils/sendResponse';
import { createLog } from '@/core/utils/createLog';
import { buildPublicPath, deleteUploadedFile } from '@/core/utils/fileStorage.util';
import * as imageService from './image.service';
import {
  imageListQuerySchema,
  imageIdParamSchema,
  createImageSchema,
  updateImageSchema,
  setPrimaryImageSchema,
} from './image.validation';

// GET /images
export async function getImages(req: Request, res: Response) {
  const query = imageListQuerySchema.parse(req.query);
  const result = await imageService.listImages(query);
  return sendPaginated(res, result.items, result.pagination, 'Images fetched successfully');
}

// GET /images/:id
export async function getImageById(req: Request, res: Response) {
  const { id } = imageIdParamSchema.parse(req.params);
  const image = await imageService.getImageById(id);

  // View activity is logged too (not just create/update/delete) so the
  // admin-logs screen shows a complete audit trail of who looked at what.
  if (req.auth) {
    await createLog({
      adminId: req.auth.id,
      description: `Viewed image (id ${id}) for car model id ${image.modelId}`,
    });
  }

  return sendSuccess(res, image, 'Image fetched successfully');
}

// POST /images
export async function createImage(req: Request, res: Response) {
  if (!req.auth) {
    throw ApiError.unauthorized();
  }
  if (!req.file) {
    throw ApiError.badRequest('Image file is required (expected field name "image")');
  }

  try {
    const input = createImageSchema.parse(req.body);
    const image = await imageService.createImage(input, req.auth.id, req.file.filename);
    return sendSuccess(res, image, 'Image uploaded successfully', 201);
  } catch (err) {
    await deleteUploadedFile(buildPublicPath('car-images', req.file.filename));
    throw err;
  }
}

// PATCH /images/:id
export async function updateImage(req: Request, res: Response) {
  const { id } = imageIdParamSchema.parse(req.params);
  const input = updateImageSchema.parse(req.body);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const image = await imageService.updateImage(id, input, req.auth.id);
  return sendSuccess(res, image, 'Image updated successfully');
}

// PATCH /images/:id/set-primary
// Dedicated quick toggle for the gallery's "set as cover" button —
// same idea as brand.controller.ts's updateBrandStatus.
export async function setPrimaryImage(req: Request, res: Response) {
  const { id } = imageIdParamSchema.parse(req.params);
  const { isPrimary } = setPrimaryImageSchema.parse(req.body);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const image = await imageService.setPrimaryImage(id, isPrimary, req.auth.id);
  return sendSuccess(res, image, 'Primary image updated successfully');
}

// PATCH /images/:id/file
// Replace the underlying image file without touching modelId/variantId/
// angle/isPrimary metadata.
export async function replaceImageFile(req: Request, res: Response) {
  const { id } = imageIdParamSchema.parse(req.params);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }
  if (!req.file) {
    throw ApiError.badRequest('No image file received (expected field name "image")');
  }

  const image = await imageService.replaceImageFile(id, req.file.filename, req.auth.id);
  return sendSuccess(res, image, 'Image file replaced successfully');
}

// DELETE /images/:id
export async function deleteImage(req: Request, res: Response) {
  const { id } = imageIdParamSchema.parse(req.params);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const result = await imageService.deleteImage(id, req.auth.id);
  return sendSuccess(res, null, result.message);
}