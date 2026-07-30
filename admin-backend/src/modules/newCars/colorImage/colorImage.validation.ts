// src/modules/newCars/colorImage/colorImage.validation.ts

import { z } from 'zod';

export const listModelsWithColorsOrImagesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().min(1).optional(),
});

export type ListModelsWithColorsOrImagesQueryParsed = z.infer<typeof listModelsWithColorsOrImagesQuerySchema>;
