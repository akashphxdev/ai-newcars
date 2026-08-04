// src/modules/public/home/car/car.validation.ts

import { z } from 'zod';

// Serves LatestCars / PopularCars / UpcomingLaunches / ElectricCars —
// one shared endpoint, differentiated by `type`, rather than 4 near-
// identical modules.
const HOME_CAR_TYPES = ['latest', 'popular', 'upcoming', 'electric'] as const;

export const homeCarListQuerySchema = z.object({
  type: z.enum(HOME_CAR_TYPES).default('latest'),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  // LatestCars' brand chips re-fetch this brand's own `limit` cars from
  // the API instead of just filtering the already-fetched fixed set.
  brand: z.string().trim().min(1).optional(),
});

export type HomeCarListQueryParsed = z.infer<typeof homeCarListQuerySchema>;
