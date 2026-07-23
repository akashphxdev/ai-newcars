// src/modules/public/home/city/city.controller.ts

import { Request, Response } from 'express';
import { sendSuccess } from '@/core/utils/sendResponse';
import { homeCityListQuerySchema } from './city.validation';
import * as cityService from './city.service';

// GET /api/public/v1/home/cities
export async function getHomeCities(req: Request, res: Response) {
  const query = homeCityListQuerySchema.parse(req.query);
  const cities = await cityService.listHomeCities(query);
  return sendSuccess(res, cities, 'Cities fetched successfully');
}
