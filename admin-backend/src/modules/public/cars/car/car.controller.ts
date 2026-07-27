// src/modules/public/cars/car/car.controller.ts

import { Request, Response } from 'express';
import { sendPaginated } from '@/core/utils/sendResponse';
import { sendSuccess } from '@/core/utils/sendResponse';
import { carListQuerySchema, carsBrowseQuerySchema, carDetailParamSchema, carDetailQuerySchema } from './car.validation';
import * as carService from './car.service';

// GET /api/public/v1/cars
export async function getAllCars(req: Request, res: Response) {
  const query = carListQuerySchema.parse(req.query);
  const result = await carService.listAllCars(query);
  return sendPaginated(res, result.items, result.pagination, 'Cars fetched successfully');
}

// GET /api/public/v1/cars/browse — "/new-cars" page: un-scoped, full
// brand+bodyType+fuelType+price filtering (unlike getAllCars' fixed
// type=latest|popular|upcoming|electric rails).
export async function getCarsBrowse(req: Request, res: Response) {
  const query = carsBrowseQuerySchema.parse(req.query);

  const result = await carService.browseCars({
    page: query.page,
    limit: query.limit,
    brandSlugs: query.brand,
    bodyTypeSlugs: query.bodyType,
    fuelTypes: query.fuelType,
    minPrice: query.minPrice,
    maxPrice: query.maxPrice,
    sort: query.sort,
  });

  return sendSuccess(res, result, 'Cars fetched successfully');
}

// GET /api/public/v1/cars/:brandSlug/:modelSlug — car model detail page
// ("/tata/punch-ev"). One payload backs all Overview/Price/Compare/
// Images/Specs/Variants tabs.
export async function getCarDetail(req: Request, res: Response) {
  const params = carDetailParamSchema.parse(req.params);
  const query = carDetailQuerySchema.parse(req.query);
  const result = await carService.getCarDetail(params.brandSlug, params.modelSlug, query.variant);
  return sendSuccess(res, result, 'Car detail fetched successfully');
}

// GET /api/public/v1/cars/:brandSlug/:modelSlug/images — dedicated
// "/photos" page, kept separate from getCarDetail so it doesn't pull
// variants/specs/features just to show a gallery.
export async function getCarImages(req: Request, res: Response) {
  const params = carDetailParamSchema.parse(req.params);
  const result = await carService.getCarImages(params.brandSlug, params.modelSlug);
  return sendSuccess(res, result, 'Car images fetched successfully');
}

// GET /api/public/v1/cars/:brandSlug/:modelSlug/faqs
export async function getCarFaqs(req: Request, res: Response) {
  const params = carDetailParamSchema.parse(req.params);
  const result = await carService.getCarFaqs(params.brandSlug, params.modelSlug);
  return sendSuccess(res, result, 'Car FAQs fetched successfully');
}

// GET /api/public/v1/cars/:brandSlug/:modelSlug/articles — the model
// page's "News" section.
export async function getCarArticles(req: Request, res: Response) {
  const params = carDetailParamSchema.parse(req.params);
  const result = await carService.getCarArticles(params.brandSlug, params.modelSlug);
  return sendSuccess(res, result, 'Car articles fetched successfully');
}
