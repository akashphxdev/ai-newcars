// src/modules/public/brands/brand/brand.controller.ts

import { Request, Response } from 'express';
import { sendSuccess } from '@/core/utils/sendResponse';
import { brandListQuerySchema, brandSlugParamSchema, brandCarsQuerySchema } from './brand.validation';
import * as brandService from './brand.service';

// GET /api/public/v1/brands
export async function getAllBrands(req: Request, res: Response) {
  const query = brandListQuerySchema.parse(req.query);
  const brands = await brandService.listAllBrands(query);
  return sendSuccess(res, brands, 'Brands fetched successfully');
}

// GET /api/public/v1/brands/with-counts
export async function getAllBrandsWithCounts(_req: Request, res: Response) {
  const brands = await brandService.listAllBrandsWithCounts();
  return sendSuccess(res, brands, 'Brands fetched successfully');
}

// GET /api/public/v1/brands/:slug
export async function getBrandBySlug(req: Request, res: Response) {
  const { slug } = brandSlugParamSchema.parse(req.params);
  const brand = await brandService.getBrandBySlug(slug);
  return sendSuccess(res, brand, 'Brand fetched successfully');
}

// GET /api/public/v1/brands/:slug/cars
export async function getBrandCars(req: Request, res: Response) {
  const { slug } = brandSlugParamSchema.parse(req.params);
  const query = brandCarsQuerySchema.parse(req.query);

  const result = await brandService.listBrandCars(slug, {
    page: query.page,
    limit: query.limit,
    bodyTypeSlugs: query.bodyType,
    fuelTypes: query.fuelType,
    minPrice: query.minPrice,
    maxPrice: query.maxPrice,
    sort: query.sort,
  });

  return sendSuccess(res, result, 'Brand cars fetched successfully');
}

// GET /api/public/v1/brands/:slug/articles
export async function getBrandArticles(req: Request, res: Response) {
  const { slug } = brandSlugParamSchema.parse(req.params);
  const articles = await brandService.listBrandArticles(slug);
  return sendSuccess(res, articles, 'Brand articles fetched successfully');
}
