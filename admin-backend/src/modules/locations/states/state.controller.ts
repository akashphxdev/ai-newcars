// src/modules/locations/state/state.controller.ts

import { Request, Response } from 'express';
import { ApiError } from '@/core/errors/ApiError';
import { sendSuccess, sendPaginated } from '@/core/utils/sendResponse';
import * as stateService from './state.service';
import {
  stateListQuerySchema,
  stateIdParamSchema,
  createStateSchema,
  updateStateSchema,
} from './state.validation';

// GET /states
export async function getStates(req: Request, res: Response) {
  const query = stateListQuerySchema.parse(req.query);
  const result = await stateService.listStates(query);
  return sendPaginated(res, result.items, result.pagination, 'States fetched successfully');
}

// GET /states/:id
export async function getStateById(req: Request, res: Response) {
  const { id } = stateIdParamSchema.parse(req.params);
  const state = await stateService.getStateById(id);
  return sendSuccess(res, state, 'State fetched successfully');
}

// POST /states
export async function createState(req: Request, res: Response) {
  const input = createStateSchema.parse(req.body);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const state = await stateService.createState(input, req.auth.id);
  return sendSuccess(res, state, 'State created successfully', 201);
}

// PATCH /states/:id
export async function updateState(req: Request, res: Response) {
  const { id } = stateIdParamSchema.parse(req.params);
  const input = updateStateSchema.parse(req.body);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const state = await stateService.updateState(id, input, req.auth.id);
  return sendSuccess(res, state, 'State updated successfully');
}

// DELETE /states/:id
export async function deleteState(req: Request, res: Response) {
  const { id } = stateIdParamSchema.parse(req.params);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const result = await stateService.deleteState(id, req.auth.id);
  return sendSuccess(res, null, result.message);
}