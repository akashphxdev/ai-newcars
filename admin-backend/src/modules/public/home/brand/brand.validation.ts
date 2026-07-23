// src/modules/public/home/brand/brand.validation.ts

import { z } from 'zod';

export const homeBrandListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(12),
});

export type HomeBrandListQueryParsed = z.infer<typeof homeBrandListQuerySchema>;
