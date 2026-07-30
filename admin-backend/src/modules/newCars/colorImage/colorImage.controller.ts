// src/modules/newCars/colorImage/colorImage.controller.ts

import { Request, Response } from 'express';
import { sendPaginated } from '@/core/utils/sendResponse';
import * as colorImageService from './colorImage.service';
import { listModelsWithColorsOrImagesQuerySchema } from './colorImage.validation';

// GET /new-cars/color-images
export async function getModelsWithColorsOrImages(req: Request, res: Response) {
  const query = listModelsWithColorsOrImagesQuerySchema.parse(req.query);
  const result = await colorImageService.listModelsWithColorsOrImages(query);
  return sendPaginated(res, result.items, result.pagination, 'Models with colors/images fetched successfully');
}
