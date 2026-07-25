// src/modules/public/brands/brand/brand.controller.ts

import { Request, Response } from 'express';
import { sendSuccess } from '@/core/utils/sendResponse';
import { brandListQuerySchema } from './brand.validation';
import * as brandService from './brand.service';

// GET /api/public/v1/brands
export async function getAllBrands(req: Request, res: Response) {
  const query = brandListQuerySchema.parse(req.query);
  const brands = await brandService.listAllBrands(query);
  return sendSuccess(res, brands, 'Brands fetched successfully');
}
