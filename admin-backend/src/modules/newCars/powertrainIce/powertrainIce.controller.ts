// src/modules/newCars/powertrainIce/powertrainIce.controller.ts

import { Request, Response } from 'express';
import { ApiError } from '@/core/errors/ApiError';
import { sendSuccess, sendPaginated } from '@/core/utils/sendResponse';
import { createLog } from '@/core/utils/createLog';
import { getClientIp } from '@/core/utils/getClientIp';
import * as powertrainIceService from './powertrainIce.service';
import {
  powertrainIceListQuerySchema,
  powertrainIceIdParamSchema,
  createPowertrainIceSchema,
  updatePowertrainIceSchema,
} from './powertrainIce.validation';

// GET /new-cars/powertrains/ice
export async function getPowertrainIceList(req: Request, res: Response) {
  const query = powertrainIceListQuerySchema.parse(req.query);
  const result = await powertrainIceService.listPowertrainIce(query);
  return sendPaginated(res, result.items, result.pagination, 'ICE powertrains fetched successfully');
}

// GET /new-cars/powertrains/ice/:id
export async function getPowertrainIceById(req: Request, res: Response) {
  const { id } = powertrainIceIdParamSchema.parse(req.params);
  const powertrain = await powertrainIceService.getPowertrainIceById(id);

  if (req.auth) {
    const v = powertrain.variant;
    await createLog({
      adminId: req.auth.id,
      description: `Viewed ICE powertrain for "${v.model.brand.name} ${v.model.name} — ${v.variantName}" (id ${id})`,
      ipAddress: getClientIp(req),
    });
  }

  return sendSuccess(res, powertrain, 'ICE powertrain fetched successfully');
}

// POST /new-cars/powertrains/ice
export async function createPowertrainIce(req: Request, res: Response) {
  const input = createPowertrainIceSchema.parse(req.body);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const powertrain = await powertrainIceService.createPowertrainIce(input, req.auth.id, getClientIp(req));
  return sendSuccess(res, powertrain, 'ICE powertrain created successfully', 201);
}

// PATCH /new-cars/powertrains/ice/:id
export async function updatePowertrainIce(req: Request, res: Response) {
  const { id } = powertrainIceIdParamSchema.parse(req.params);
  const input = updatePowertrainIceSchema.parse(req.body);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const powertrain = await powertrainIceService.updatePowertrainIce(id, input, req.auth.id, getClientIp(req));
  return sendSuccess(res, powertrain, 'ICE powertrain updated successfully');
}

// PATCH /new-cars/powertrains/ice/:id/restore
export async function restorePowertrainIce(req: Request, res: Response) {
  const { id } = powertrainIceIdParamSchema.parse(req.params);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const result = await powertrainIceService.restorePowertrainIce(id, req.auth.id, getClientIp(req));
  return sendSuccess(res, null, result.message);
}

// DELETE /new-cars/powertrains/ice/:id
export async function deletePowertrainIce(req: Request, res: Response) {
  const { id } = powertrainIceIdParamSchema.parse(req.params);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const result = await powertrainIceService.deletePowertrainIce(id, req.auth.id, getClientIp(req));
  return sendSuccess(res, null, result.message);
}