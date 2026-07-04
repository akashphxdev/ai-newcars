// src/modules/locations/city/city.controller.ts

import { Request, Response } from 'express';
import { ApiError } from '@/core/errors/ApiError';
import { sendSuccess, sendPaginated } from '@/core/utils/sendResponse';
import { buildPublicPath, deleteUploadedFile } from '@/core/utils/fileStorage.util';
import * as cityService from './city.service';
import { cityListQuerySchema, cityIdParamSchema, createCitySchema, updateCitySchema, updateCityFlagsSchema } from './city.validation';

// GET /cities
export async function getCities(req: Request, res: Response) {
  const query = cityListQuerySchema.parse(req.query);
  const result = await cityService.listCities(query);
  return sendPaginated(res, result.items, result.pagination, 'Cities fetched successfully');
}

// GET /cities/:id
export async function getCityById(req: Request, res: Response) {
  const { id } = cityIdParamSchema.parse(req.params);
  const city = await cityService.getCityById(id);
  return sendSuccess(res, city, 'City fetched successfully');
}


export async function createCity(req: Request, res: Response) {
  if (!req.auth) {
    throw ApiError.unauthorized();
  }
  if (!req.file) {
    throw ApiError.badRequest('City logo is required (expected field name "logo")');
  }
  try {
    const input = createCitySchema.parse(req.body);
    const city = await cityService.createCity(input, req.file.filename, req.auth.id);
    return sendSuccess(res, city, 'City created successfully', 201);
  } catch (err) {
    await deleteUploadedFile(buildPublicPath('cities', req.file.filename));
    throw err;
  }
}

// PATCH /cities/:id
export async function updateCity(req: Request, res: Response) {
  const { id } = cityIdParamSchema.parse(req.params);
  const input = updateCitySchema.parse(req.body);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const city = await cityService.updateCity(id, input, req.auth.id);
  return sendSuccess(res, city, 'City updated successfully');
}

export async function updateCityFlags(req: Request, res: Response) {
  const { id } = cityIdParamSchema.parse(req.params);
  const flags = updateCityFlagsSchema.parse(req.body);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const city = await cityService.updateCityFlags(id, flags, req.auth.id);
  return sendSuccess(res, city, 'City flags updated successfully');
}
export async function uploadCityLogo(req: Request, res: Response) {
  const { id } = cityIdParamSchema.parse(req.params);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }
  if (!req.file) {
    throw ApiError.badRequest('No image file received (expected field name "logo")');
  }

  const city = await cityService.uploadCityLogo(id, req.file.filename, req.auth.id);
  return sendSuccess(res, city, 'City logo updated successfully');
}

// DELETE /cities/:id
export async function deleteCity(req: Request, res: Response) {
  const { id } = cityIdParamSchema.parse(req.params);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const result = await cityService.deleteCity(id, req.auth.id);
  return sendSuccess(res, null, result.message);
}