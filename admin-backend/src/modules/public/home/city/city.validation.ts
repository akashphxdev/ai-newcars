// src/modules/public/home/city/city.validation.ts

import { z } from 'zod';

export const homeCityListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export type HomeCityListQueryParsed = z.infer<typeof homeCityListQuerySchema>;
