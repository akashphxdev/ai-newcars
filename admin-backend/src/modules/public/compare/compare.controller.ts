// src/modules/public/compare/compare.controller.ts

import { Request, Response } from 'express';
import { sendSuccess, sendPaginated } from '@/core/utils/sendResponse';
import {
  compareQuerySchema,
  carVariantOptionsParamsSchema,
  variantPowertrainOptionsParamsSchema,
  randomPairsQuerySchema,
  brandCrossPairsQuerySchema,
  modelCrossPairsQuerySchema,
} from './compare.validation';
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

// GET /api/public/v1/compare/car-options/:slug/variants/:variantId/powertrains
export async function getVariantPowertrainOptions(req: Request, res: Response) {
  const { slug, variantId } = variantPowertrainOptionsParamsSchema.parse(req.params);
  const options = await compareService.listVariantPowertrainOptions(slug, variantId);
  return sendSuccess(res, options, 'Powertrain options fetched successfully');
}

// GET /api/public/v1/compare/random-pairs
export async function getRandomPairs(req: Request, res: Response) {
  const query = randomPairsQuerySchema.parse(req.query);
  const result = await compareService.getRandomComparisonPairs(query);
  return sendPaginated(res, result.items, result.pagination, 'Random comparison pairs fetched successfully');
}

// GET /api/public/v1/compare/brand-cross-pairs?brandSlug=X&count=N
// Cross-brand match-ups (this brand vs every other brand) — a brand-page
// section, distinct from random-pairs?brandSlug= which pairs cars WITHIN
// one brand only.
export async function getBrandCrossPairs(req: Request, res: Response) {
  const { brandSlug, count } = brandCrossPairsQuerySchema.parse(req.query);
  const pairs = await compareService.getBrandCrossBrandPairs(brandSlug, count);
  return sendSuccess(res, pairs, 'Cross-brand comparison pairs fetched successfully');
}

// GET /api/public/v1/compare/model-cross-pairs?brandSlug=X&modelSlug=Y&count=N
// Model page's "Comparison" section — this exact model vs random others.
export async function getModelCrossPairs(req: Request, res: Response) {
  const { brandSlug, modelSlug, count } = modelCrossPairsQuerySchema.parse(req.query);
  const pairs = await compareService.getModelCrossPairs(brandSlug, modelSlug, count);
  return sendSuccess(res, pairs, 'Model comparison pairs fetched successfully');
}
