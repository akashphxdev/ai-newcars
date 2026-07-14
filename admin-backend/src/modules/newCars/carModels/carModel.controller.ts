// src/modules/newCars/carModels/carModel.controller.ts

import { Request, Response } from 'express';
import { ApiError } from '@/core/errors/ApiError';
import { sendSuccess, sendPaginated } from '@/core/utils/sendResponse';
import { createLog } from '@/core/utils/createLog';
import { buildPublicPath, deleteUploadedFile } from '@/core/utils/fileStorage.util';
import * as carModelService from './carModel.service';
import {
  carModelListQuerySchema,
  carModelOptionsQuerySchema,
  carModelIdParamSchema,
  createCarModelSchema,
  updateCarModelSchema,
  updateCarModelLaunchStatusSchema,
} from './carModel.validation';

// GET /car-models
export async function getCarModels(req: Request, res: Response) {
  const query = carModelListQuerySchema.parse(req.query);
  const result = await carModelService.listCarModels(query);
  return sendPaginated(res, result.items, result.pagination, 'Car models fetched successfully');
}

// GET /car-models/options — lightweight, unpaginated {id, name,
// brandId} list for dropdowns, optionally filtered by brandId.
export async function getCarModelOptions(req: Request, res: Response) {
  const query = carModelOptionsQuerySchema.parse(req.query);
  const options = await carModelService.listCarModelOptions(query);
  return sendSuccess(res, options, 'Car model options fetched successfully');
}

// GET /car-models/:id
export async function getCarModelById(req: Request, res: Response) {
  const { id } = carModelIdParamSchema.parse(req.params);
  const carModel = await carModelService.getCarModelById(id);

  if (req.auth) {
    await createLog({
      adminId: req.auth.id,
      description: `Viewed car model "${carModel.name}" (id ${id})`,
    });
  }

  return sendSuccess(res, carModel, 'Car model fetched successfully');
}

export async function createCarModel(req: Request, res: Response) {
  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  if (!req.file) {
    throw ApiError.badRequest('Cover image is required (expected field name "coverImage")');
  }

  try {
    const input = createCarModelSchema.parse(req.body);
    const carModel = await carModelService.createCarModel(input, req.auth.id, req.file.filename);
    return sendSuccess(res, carModel, 'Car model created successfully', 201);
  } catch (err) {
    if (req.file) {
      await deleteUploadedFile(buildPublicPath('car-model-covers', req.file.filename));
    }
    throw err;
  }
}

// PATCH /car-models/:id
export async function updateCarModel(req: Request, res: Response) {
  const { id } = carModelIdParamSchema.parse(req.params);
  const input = updateCarModelSchema.parse(req.body);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const carModel = await carModelService.updateCarModel(id, input, req.auth.id);
  return sendSuccess(res, carModel, 'Car model updated successfully');
}

export async function updateCarModelLaunchStatus(req: Request, res: Response) {
  const { id } = carModelIdParamSchema.parse(req.params);
  const { launchStatus, expectedLaunchDate } = updateCarModelLaunchStatusSchema.parse(req.body);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const carModel = await carModelService.updateCarModelLaunchStatus(id, launchStatus, expectedLaunchDate, req.auth.id);
  return sendSuccess(res, carModel, 'Car model launch status updated successfully');
}

export async function uploadCarModelCoverImage(req: Request, res: Response) {
  const { id } = carModelIdParamSchema.parse(req.params);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }
  if (!req.file) {
    throw ApiError.badRequest('No image file received (expected field name "coverImage")');
  }

  const carModel = await carModelService.uploadCarModelCoverImage(id, req.file.filename, req.auth.id);
  return sendSuccess(res, carModel, 'Cover image updated successfully');
}

// DELETE /car-models/:id
export async function deleteCarModel(req: Request, res: Response) {
  const { id } = carModelIdParamSchema.parse(req.params);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const result = await carModelService.deleteCarModel(id, req.auth.id);
  return sendSuccess(res, null, result.message);
}