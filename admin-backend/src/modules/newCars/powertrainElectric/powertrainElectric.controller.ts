// src/modules/newCars/powertrainElectric/powertrainElectric.controller.ts

import { Request, Response } from 'express';
import { ApiError } from '@/core/errors/ApiError';
import { sendSuccess, sendPaginated } from '@/core/utils/sendResponse';
import { createLog } from '@/core/utils/createLog';
import * as powertrainElectricService from './powertrainElectric.service';
import {
  powertrainElectricListQuerySchema,
  powertrainElectricIdParamSchema,
  createPowertrainElectricSchema,
  updatePowertrainElectricSchema,
} from './powertrainElectric.validation';

// GET /new-cars/powertrains/electric
export async function getPowertrainElectricList(req: Request, res: Response) {
  const query = powertrainElectricListQuerySchema.parse(req.query);
  const result = await powertrainElectricService.listPowertrainElectric(query);
  return sendPaginated(res, result.items, result.pagination, 'Electric powertrains fetched successfully');
}

// GET /new-cars/powertrains/electric/:id
export async function getPowertrainElectricById(req: Request, res: Response) {
  const { id } = powertrainElectricIdParamSchema.parse(req.params);
  const powertrain = await powertrainElectricService.getPowertrainElectricById(id);

  if (req.auth) {
    const v = powertrain.variant;
    await createLog({
      adminId: req.auth.id,
      description: `Viewed Electric powertrain for "${v.model.brand.name} ${v.model.name} — ${v.variantName}" (id ${id})`,
    });
  }

  return sendSuccess(res, powertrain, 'Electric powertrain fetched successfully');
}

// POST /new-cars/powertrains/electric
export async function createPowertrainElectric(req: Request, res: Response) {
  const input = createPowertrainElectricSchema.parse(req.body);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const powertrain = await powertrainElectricService.createPowertrainElectric(input, req.auth.id);
  return sendSuccess(res, powertrain, 'Electric powertrain created successfully', 201);
}

// PATCH /new-cars/powertrains/electric/:id
export async function updatePowertrainElectric(req: Request, res: Response) {
  const { id } = powertrainElectricIdParamSchema.parse(req.params);
  const input = updatePowertrainElectricSchema.parse(req.body);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const powertrain = await powertrainElectricService.updatePowertrainElectric(id, input, req.auth.id);
  return sendSuccess(res, powertrain, 'Electric powertrain updated successfully');
}

// PATCH /new-cars/powertrains/electric/:id/restore
export async function restorePowertrainElectric(req: Request, res: Response) {
  const { id } = powertrainElectricIdParamSchema.parse(req.params);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const result = await powertrainElectricService.restorePowertrainElectric(id, req.auth.id);
  return sendSuccess(res, null, result.message);
}

// DELETE /new-cars/powertrains/electric/:id
export async function deletePowertrainElectric(req: Request, res: Response) {
  const { id } = powertrainElectricIdParamSchema.parse(req.params);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const result = await powertrainElectricService.deletePowertrainElectric(id, req.auth.id);
  return sendSuccess(res, null, result.message);
}