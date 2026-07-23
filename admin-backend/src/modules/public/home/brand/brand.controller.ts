// src/modules/public/home/brand/brand.controller.ts

import { Request, Response } from 'express';
import { sendSuccess } from '@/core/utils/sendResponse';
import { homeBrandListQuerySchema } from './brand.validation';
import * as brandService from './brand.service';

// GET /api/public/v1/home/brands
export async function getHomeBrands(req: Request, res: Response) {
  const query = homeBrandListQuerySchema.parse(req.query);
  const brands = await brandService.listHomeBrands(query);
  return sendSuccess(res, brands, 'Brands fetched successfully');
}
