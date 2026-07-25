// src/modules/public/compare/compare.controller.ts

import { Request, Response } from 'express';
import { sendSuccess, sendPaginated } from '@/core/utils/sendResponse';
import { compareQuerySchema, carVariantOptionsParamsSchema, randomPairsQuerySchema } from './compare.validation';
import * as compareService from './compare.service';

// GET /api/public/v1/compare?carA=slug&carB=slug&variantA=id&variantB=id
export async function getCompareData(req: Request, res: Response) {
  const query = compareQuerySchema.parse(req.query);
  const result = await compareService.getCompareData(query);
  return sendSuccess(res, result, 'Comparison fetched successfully');
}

// GET /api/public/v1/compare/car-options
export async function getCarOptions(_req: Request, res: Response) {
  const options = await compareService.listCarOptions();
  return sendSuccess(res, options, 'Car options fetched successfully');
}

// GET /api/public/v1/compare/car-options/:slug/variants
export async function getCarVariantOptions(req: Request, res: Response) {
  const { slug } = carVariantOptionsParamsSchema.parse(req.params);
  const options = await compareService.listCarVariantOptions(slug);
  return sendSuccess(res, options, 'Variant options fetched successfully');
}

// GET /api/public/v1/compare/random-pairs
export async function getRandomPairs(req: Request, res: Response) {
  const query = randomPairsQuerySchema.parse(req.query);
  const result = await compareService.getRandomComparisonPairs(query);
  return sendPaginated(res, result.items, result.pagination, 'Random comparison pairs fetched successfully');
}
