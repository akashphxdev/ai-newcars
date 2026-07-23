// src/modules/public/home/car/car.controller.ts

import { Request, Response } from 'express';
import { sendSuccess } from '@/core/utils/sendResponse';
import { homeCarListQuerySchema } from './car.validation';
import * as carService from './car.service';

// GET /api/public/v1/home/cars
export async function getHomeCars(req: Request, res: Response) {
  const query = homeCarListQuerySchema.parse(req.query);
  const cars = await carService.listHomeCars(query);
  return sendSuccess(res, cars, 'Cars fetched successfully');
}
