// src/modules/public/cars/car/car.controller.ts

import { Request, Response } from 'express';
import { sendPaginated } from '@/core/utils/sendResponse';
import { carListQuerySchema } from './car.validation';
import * as carService from './car.service';

// GET /api/public/v1/cars
export async function getAllCars(req: Request, res: Response) {
  const query = carListQuerySchema.parse(req.query);
  const result = await carService.listAllCars(query);
  return sendPaginated(res, result.items, result.pagination, 'Cars fetched successfully');
}
