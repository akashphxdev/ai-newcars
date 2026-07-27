// src/modules/public/bodyTypes/bodyType/bodyType.controller.ts

import { Request, Response } from 'express';
import { sendSuccess } from '@/core/utils/sendResponse';
import { bodyTypeSlugParamSchema, bodyTypeCarsQuerySchema } from './bodyType.validation';
import * as bodyTypeService from './bodyType.service';

// GET /api/public/v1/body-types
export async function getAllBodyTypes(_req: Request, res: Response) {
  const bodyTypes = await bodyTypeService.listAllBodyTypesWithCounts();
  return sendSuccess(res, bodyTypes, 'Body types fetched successfully');
}

// GET /api/public/v1/body-types/:slug
export async function getBodyTypeBySlug(req: Request, res: Response) {
  const { slug } = bodyTypeSlugParamSchema.parse(req.params);
  const bodyType = await bodyTypeService.getBodyTypeBySlug(slug);
  return sendSuccess(res, bodyType, 'Body type fetched successfully');
}

// GET /api/public/v1/body-types/:slug/cars
export async function getBodyTypeCars(req: Request, res: Response) {
  const { slug } = bodyTypeSlugParamSchema.parse(req.params);
  const query = bodyTypeCarsQuerySchema.parse(req.query);

  const result = await bodyTypeService.listBodyTypeCars(slug, {
    page: query.page,
    limit: query.limit,
    brandSlugs: query.brand,
    fuelTypes: query.fuelType,
    minPrice: query.minPrice,
    maxPrice: query.maxPrice,
    sort: query.sort,
  });

  return sendSuccess(res, result, 'Body type cars fetched successfully');
}
