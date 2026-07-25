// src/modules/public/cars/car/car.validation.ts

import { z } from 'zod';

const CAR_TYPES = ['latest', 'popular', 'upcoming', 'electric'] as const;

export const carListQuerySchema = z.object({
  type: z.enum(CAR_TYPES).default('latest'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(48).default(12),
});

export type CarListQueryParsed = z.infer<typeof carListQuerySchema>;
