// src/modules/cars/brand/brand.controller.ts

import { Request, Response } from 'express';
import { ApiError } from '@/core/errors/ApiError';
import { sendSuccess, sendPaginated } from '@/core/utils/sendResponse';
import { buildPublicPath, deleteUploadedFile } from '@/core/utils/fileStorage.util';
import { createLog } from '@/core/utils/createLog';
import * as brandService from './brand.service';
import {
  brandListQuerySchema,
  brandOptionsQuerySchema,
  brandIdParamSchema,
  createBrandSchema,
  updateBrandSchema,
  updateBrandStatusSchema,
} from './brand.validation';

// GET /brands
export async function getBrands(req: Request, res: Response) {
  const query = brandListQuerySchema.parse(req.query);
  const result = await brandService.listBrands(query);
  return sendPaginated(res, result.items, result.pagination, 'Brands fetched successfully');
}

// GET /brands/options — lightweight, unpaginated {id, name} list for
// dropdowns.
export async function getBrandOptions(req: Request, res: Response) {
  const query = brandOptionsQuerySchema.parse(req.query);
  const options = await brandService.listBrandOptions(query);
  return sendSuccess(res, options, 'Brand options fetched successfully');
}

// GET /brands/:id
export async function getBrandById(req: Request, res: Response) {
  const { id } = brandIdParamSchema.parse(req.params);
  const brand = await brandService.getBrandById(id);

  if (req.auth) {
    await createLog({
      adminId: req.auth.id,
      description: `Viewed brand "${brand.name}" (id ${id})`,
    });
  }

  return sendSuccess(res, brand, 'Brand fetched successfully');
}

// POST /brands
export async function createBrand(req: Request, res: Response) {
  if (!req.auth) {
    throw ApiError.unauthorized();
  }
  if (!req.file) {
    throw ApiError.badRequest('Brand logo is required (expected field name "logo")');
  }

  try {
    const input = createBrandSchema.parse(req.body);
    const brand = await brandService.createBrand(input, req.auth.id, req.file.filename);
    return sendSuccess(res, brand, 'Brand created successfully', 201);
  } catch (err) {
    await deleteUploadedFile(buildPublicPath('brands', req.file.filename));
    throw err;
  }
}

// PATCH /brands/:id
export async function updateBrand(req: Request, res: Response) {
  const { id } = brandIdParamSchema.parse(req.params);
  const input = updateBrandSchema.parse(req.body);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const brand = await brandService.updateBrand(id, input, req.auth.id);
  return sendSuccess(res, brand, 'Brand updated successfully');
}
export async function updateBrandStatus(req: Request, res: Response) {
  const { id } = brandIdParamSchema.parse(req.params);
  const { isActive } = updateBrandStatusSchema.parse(req.body);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const brand = await brandService.updateBrandStatus(id, isActive, req.auth.id);
  return sendSuccess(res, brand, 'Brand status updated successfully');
}

export async function uploadBrandLogo(req: Request, res: Response) {
  const { id } = brandIdParamSchema.parse(req.params);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }
  if (!req.file) {
    throw ApiError.badRequest('No image file received (expected field name "logo")');
  }

  const brand = await brandService.uploadBrandLogo(id, req.file.filename, req.auth.id);
  return sendSuccess(res, brand, 'Brand logo updated successfully');
}

// DELETE /brands/:id
export async function deleteBrand(req: Request, res: Response) {
  const { id } = brandIdParamSchema.parse(req.params);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const result = await brandService.deleteBrand(id, req.auth.id);
  return sendSuccess(res, null, result.message);
}