// src/modules/newCars/carModels/carModel.controller.ts

import { Request, Response } from 'express';
import { ApiError } from '@/core/errors/ApiError';
import { sendSuccess, sendPaginated } from '@/core/utils/sendResponse';
import * as carModelService from './carModel.service';
import {
  carModelListQuerySchema,
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

// GET /car-models/:id
export async function getCarModelById(req: Request, res: Response) {
  const { id } = carModelIdParamSchema.parse(req.params);
  const carModel = await carModelService.getCarModelById(id);
  return sendSuccess(res, carModel, 'Car model fetched successfully');
}

// POST /car-models
export async function createCarModel(req: Request, res: Response) {
  const input = createCarModelSchema.parse(req.body);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const carModel = await carModelService.createCarModel(input, req.auth.id);
  return sendSuccess(res, carModel, 'Car model created successfully', 201);
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

// PATCH /car-models/:id/launch-status
// Lightweight endpoint for the row-level quick launch-status change on
// the car model listing page — doesn't require sending the full edit payload.
export async function updateCarModelLaunchStatus(req: Request, res: Response) {
  const { id } = carModelIdParamSchema.parse(req.params);
  const { launchStatus } = updateCarModelLaunchStatusSchema.parse(req.body);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const carModel = await carModelService.updateCarModelLaunchStatus(id, launchStatus, req.auth.id);
  return sendSuccess(res, carModel, 'Car model launch status updated successfully');
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