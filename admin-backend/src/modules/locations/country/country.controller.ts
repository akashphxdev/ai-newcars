// src/modules/locations/country/country.controller.ts

import { Request, Response } from 'express';
import { ApiError } from '@/core/errors/ApiError';
import { sendSuccess, sendPaginated } from '@/core/utils/sendResponse';
import * as countryService from './country.service';
import {
  countryListQuerySchema,
  countryIdParamSchema,
  createCountrySchema,
  updateCountrySchema,
  updateCountryStatusSchema,
} from './country.validation';

// GET /countries
export async function getCountries(req: Request, res: Response) {
  const query = countryListQuerySchema.parse(req.query);
  const result = await countryService.listCountries(query);
  return sendPaginated(res, result.items, result.pagination, 'Countries fetched successfully');
}

// GET /countries/:id
export async function getCountryById(req: Request, res: Response) {
  const { id } = countryIdParamSchema.parse(req.params);
  const country = await countryService.getCountryById(id);
  return sendSuccess(res, country, 'Country fetched successfully');
}

// POST /countries
export async function createCountry(req: Request, res: Response) {
  const input = createCountrySchema.parse(req.body);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const country = await countryService.createCountry(input, req.auth.id);
  return sendSuccess(res, country, 'Country created successfully', 201);
}

// PATCH /countries/:id
export async function updateCountry(req: Request, res: Response) {
  const { id } = countryIdParamSchema.parse(req.params);
  const input = updateCountrySchema.parse(req.body);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const country = await countryService.updateCountry(id, input, req.auth.id);
  return sendSuccess(res, country, 'Country updated successfully');
}

export async function updateCountryStatus(req: Request, res: Response) {
  const { id } = countryIdParamSchema.parse(req.params);
  const { isActive } = updateCountryStatusSchema.parse(req.body);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const country = await countryService.updateCountryStatus(id, isActive, req.auth.id);
  return sendSuccess(res, country, 'Country status updated successfully');
}

// DELETE /countries/:id
export async function deleteCountry(req: Request, res: Response) {
  const { id } = countryIdParamSchema.parse(req.params);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const result = await countryService.deleteCountry(id, req.auth.id);
  return sendSuccess(res, null, result.message);
}